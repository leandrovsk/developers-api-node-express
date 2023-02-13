import express, { Application } from "express";
import { startDatabase } from "./database";
import { deleteDeveloper, editDeveloper, editDeveloperInfo, getAllDevelopers, getDeveloper, listAllDevProjects, registerNewDeveloper, registerNewDevInfo } from "./logics/developers.logic";
import { deleteProject, deleteTechnologyFromProject, editProject, getAllProjects, getProject, registerNewProject, registerNewTech } from "./logics/projects.logic";

const app: Application = express();
app.use(express.json());

app.post("/developers", registerNewDeveloper);
app.get("/developers/:id", getDeveloper);
app.get("/developers/:id/projects", listAllDevProjects);
app.get("/developers", getAllDevelopers);
app.patch("/developers/:id", editDeveloper);
app.delete("/developers/:id", deleteDeveloper);
app.post("/developers/:id/infos", registerNewDevInfo);
app.patch("/developers/:id/infos", editDeveloperInfo);

app.post("/projects", registerNewProject);
app.get("/projects/:id", getProject);
app.get("/projects", getAllProjects);
app.patch("/projects/:id", editProject);
app.delete("/projects/:id", deleteProject);
app.post("/projects/:id/technologies", registerNewTech);
app.delete("/projects/:id/technologies/:name", deleteTechnologyFromProject);

app.listen(3000, async () => {
  await startDatabase();
  console.log("Server is running!");
});
