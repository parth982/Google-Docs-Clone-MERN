const connectDB = require("./connectDB");
const Doc = require("./Doc");
require("dotenv").config();

const io = require("socket.io")(process.env.PORT, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

connectDB()
  .then(() => {
    console.log("Connected to Database");

    io.on("connection", (socket) => {
      socket.on("get-document", async (documentId) => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId);
        socket.emit("load-document", document.data);

        socket.on("send-changes", (delta) => {
          socket.broadcast.to(documentId).emit("receive-changes", delta);
        });

        socket.on("save-document", async (data) => {
          await Doc.findByIdAndUpdate(documentId, { data });
        });
      });
    });
  })
  .catch((err) => console.log("Failed to Connect to Database"));

async function findOrCreateDocument(id) {
  if (id == null) return;
  const document = await Doc.findById(id);
  if (document) return document;
  return await Doc.create({ _id: id, data: "" });
}
