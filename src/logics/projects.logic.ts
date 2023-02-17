import { Request, Response } from "express";
import { QueryConfig, QueryResult } from "pg";
import format from "pg-format";
import { client } from "../database";
import { DeveloperResult } from "../interfaces/developers.interfaces";
import { IProjectRequest, ITechRequest, ProjectResult, TechResult } from "../interfaces/projects.interfaces";

const registerNewProject = async (req: Request, res: Response): Promise<Response> => {
  const newProjectReqBody: IProjectRequest = req.body;

  let queryString: string = `
    SELECT
      *
    FROM
      developers
    WHERE
      id = $1;
  `;

  const queryConfigCheckDev: QueryConfig = {
    text: queryString,
    values: [newProjectReqBody.developerId],
  };

  const queryResultCheckDev: DeveloperResult = await client.query(queryConfigCheckDev);

  if (queryResultCheckDev.rowCount === 0) {
    return res.status(404).json({
      message: "Developer not found.",
    });
  }

  queryString = format(
    `
      INSERT INTO
        projects (%I)
      VALUES (%L)
      RETURNING *;
    `,
    Object.keys(newProjectReqBody),
    Object.values(newProjectReqBody)
  );

  const queryResult: ProjectResult = await client.query(queryString);

  return res.status(201).json(queryResult.rows[0]);
};

const editProject = async (req: Request, res: Response): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);
  const projectInfoBody = req.body;

  const queryString = format(
    `
      UPDATE
        projects
      SET(%I) = ROW(%L)
      WHERE
        id = $1
      RETURNING *;
  `,
    Object.keys(projectInfoBody),
    Object.values(projectInfoBody)
  );

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId],
  };

  try {
    const queryResult: ProjectResult = await client.query(queryConfig);
    return res.status(200).json(queryResult.rows[0]);
  } catch (error: any) {
    if (error.message.includes(`insert or update on table "projects" violates foreign key constraint`)) {
      return res.status(404).json({
        message: "Developer not found.",
      });
    } else {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
};

const getProject = async (req: Request, res: Response): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);

  const queryString: string = `
    SELECT
      pro.id AS "projectId",
      pro.name AS "projectName",
      pro.description AS "projectDescription",
      pro."estimatedTime" as "projectEstimatedTime",
      pro.repository AS "projectRepository",
      pro."startDate" AS "projectStartDate",
      pro."endDate" AS "projectEndDate",
      pro."developerId" AS "projectDeveloperID",
      tech.id AS "technologyId",
      tech.name AS "technologyName"
    FROM
      projects pro
    LEFT JOIN
      projects_technologies ptg ON pro."id" = ptg."projectId"
    LEFT JOIN
      technologies tech ON ptg."technologyId" = tech."id"
    WHERE
      pro.id = $1
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId],
  };

  const queryResult: ProjectResult = await client.query(queryConfig);

  return res.status(200).json(queryResult.rows);
};

const getAllProjects = async (req: Request, res: Response): Promise<Response> => {
  const queryString: string = `
    SELECT
      pro.id AS "projectId",
      pro.name AS "projectName",
      pro.description AS "projectDescription",
      pro."estimatedTime" as "projectEstimatedTime",
      pro.repository AS "projectRepository",
      pro."startDate" AS "projectStartDate",
      pro."endDate" AS "projectEndDate",
      pro."developerId" AS "projectDeveloperID",
      tech.id AS "technologyId",
      tech.name AS "technologyName"
    FROM
      projects pro
    LEFT JOIN
      projects_technologies ptg ON pro."id" = ptg."projectId"
    LEFT JOIN
      technologies tech ON ptg."technologyId" = tech."id"
    ORDER BY
      pro.id
  `;

  const queryResult: ProjectResult = await client.query(queryString);

  return res.status(200).json(queryResult.rows);
};

const deleteProject = async (req: Request, res: Response): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);

  const queryString: string = `
    DELETE FROM
      projects
    WHERE
      id = $1;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId],
  };

  await client.query(queryConfig);

  return res.status(200).json();
};

const registerNewTech = async (req: Request, res: Response): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);
  const newTech: ITechRequest = req.body;

  let queryString: string = `
    SELECT 
      tech.id AS "technologyId",
      tech.name AS "technologyName",
      pro.id AS "projectId",
      pro.name AS "projectName",
      pro.description AS "projectDescription",
      pro."estimatedTime" as "projectEstimatedTime",
      pro.repository AS "projectRepository",
      pro."startDate" AS "projectStartDate",
      pro."endDate" AS "projectEndDate"
    FROM
      technologies tech
    LEFT JOIN
      projects pro ON pro.id = $1
    WHERE
      tech.name = $2;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId, newTech.name],
  };

  const queryResult: QueryResult = await client.query(queryConfig);

  queryString = `
    INSERT INTO
      projects_technologies ("addedIn", "projectId", "technologyId")
    VALUES ($1, $2, $3)
    RETURNING *; 
  `;

  const newDate = new Date();

  const queryConfigPTech: QueryConfig = {
    text: queryString,
    values: [newDate, projectId, queryResult.rows[0].technologyId],
  };

  await client.query(queryConfigPTech);

  return res.status(201).json(queryResult.rows[0]);
};

const deleteTechnologyFromProject = async (req: Request, res: Response): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);
  const techName: string = req.params.name;

  const requiredTechnologies = ["JavaScript", "Python", "React", "Express.js", "HTML", "CSS", "Django", "PostgreSQL", "MongoDB"];

  if (!requiredTechnologies.includes(techName)) {
    return res.status(404).json({
      message: "Technology not supported",
      options: requiredTechnologies,
    });
  }

  let queryString: string = `
    SELECT
      *
    FROM
      technologies
    WHERE
      name = $1
  `;

  const queryConfigTechName: QueryConfig = {
    text: queryString,
    values: [techName],
  };

  const queryConfigTechNameResult: QueryResult = await client.query(queryConfigTechName);

  queryString = `
    DELETE FROM
      projects_technologies
    WHERE
      "projectId" = $1 AND "technologyId" = $2;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId, queryConfigTechNameResult.rows[0].id],
  };

  const queryResult = await client.query(queryConfig);

  if (queryResult.rowCount === 0) {
    return res.status(404).json({
      message: `Technology '${techName}' not found on this Project.`,
    });
  }

  return res.status(200).json();
};

export { registerNewProject, getAllProjects, getProject, registerNewTech, editProject, deleteProject, deleteTechnologyFromProject };
