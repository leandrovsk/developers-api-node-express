import express, { Application } from "express";
import { startDatabase } from "./database";

const app: Application = express();
app.use(express.json());

app.post("/developers");
app.get("/developers/:id");
app.get("/developers/:id/projects");
app.get("/developers");
app.patch("/developers/:id");
app.delete("/developers/:id");
app.post("/developers/:id/infos");
app.patch("/developers/:id/infos");

app.post("/projects");
app.get("/projects/:id");
app.get("/projects");
app.patch("/projects/:id");
app.delete("/projects/:id");
app.post("/projects/:id/technologies");
app.post("/projects/:id/technologies/:name");

app.listen(3000, async () => {
  await startDatabase();
  console.log("Server is running!");
});
