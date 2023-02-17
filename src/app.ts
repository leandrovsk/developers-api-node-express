import express, { Application } from "express";
import { startDatabase } from "./database";
import { deleteDeveloper, editDeveloper, editDeveloperInfo, getAllDevelopers, getDeveloper, listAllDevProjects, registerNewDeveloper, registerNewDevInfo } from "./logics/developers.logic";
import { deleteProject, deleteTechnologyFromProject, editProject, getAllProjects, getProject, registerNewProject, registerNewTech } from "./logics/projects.logic";
import { ensureDeveloperExists, validateDeveloperBodyMiddleware, validateInfoBodyMiddleware } from "./middleswares/developers.middlewares";
import { ensureProjectExists, validateProjectBodyMiddleware, validateTechBodyMiddleware } from "./middleswares/projects.middlewares";

const app: Application = express();
app.use(express.json());

app.post("/developers", validateDeveloperBodyMiddleware, registerNewDeveloper);
app.get("/developers/:id", ensureDeveloperExists, getDeveloper);
app.get("/developers/:id/projects", ensureDeveloperExists, listAllDevProjects);
app.get("/developers", getAllDevelopers);
app.patch("/developers/:id", ensureDeveloperExists, validateDeveloperBodyMiddleware, editDeveloper);
app.delete("/developers/:id", ensureDeveloperExists, deleteDeveloper);
app.post("/developers/:id/infos",ensureDeveloperExists, validateInfoBodyMiddleware, registerNewDevInfo);
app.patch("/developers/:id/infos", ensureDeveloperExists, validateInfoBodyMiddleware, editDeveloperInfo);

app.post("/projects", validateProjectBodyMiddleware, registerNewProject);
app.get("/projects/:id", ensureProjectExists, getProject);
app.get("/projects", getAllProjects);
app.patch("/projects/:id", ensureProjectExists, validateProjectBodyMiddleware, editProject);
app.delete("/projects/:id", ensureProjectExists, deleteProject);
app.post("/projects/:id/technologies", ensureProjectExists, validateTechBodyMiddleware, registerNewTech);
app.delete("/projects/:id/technologies/:name", ensureProjectExists, deleteTechnologyFromProject);

app.listen(3000, async () => {
  await startDatabase();
  console.log("Server is running!");
});
