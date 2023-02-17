import { Request, Response } from "express";
import { QueryConfig, QueryResult } from "pg";
import format from "pg-format";
import { client } from "../database";
import { DeveloperResult } from "../interfaces/developers.interfaces";
import { IProjectRequest, ITechRequest, ProjectResult, TechResult } from "../interfaces/projects.interfaces";

const registerNewProject = async (req: Request, res: Response): Promise<Response> => {
  const newProjectReqBody: IProjectRequest = {
    name: req.body.name,
    description: req.body.description,
    estimatedTime: req.body.estimatedTime,
    repository: req.body.repository,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    developerId: req.body.developerId,
  };

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

const getAllProjects = async (req: Request, res: Response): Promise<Response> => {
  const queryString: string = `
  SELECT
    pro.*,
    string_agg(DISTINCT tech.name, ',') as technologies
  FROM
    projects pro
  LEFT JOIN
    projects_technologies ptg ON pro."id" = ptg."projectId"
  LEFT JOIN
    technologies tech ON ptg."technologyId" = tech."id"
  GROUP BY pro.id;
  `;

  const queryResult: ProjectResult = await client.query(queryString);

  return res.status(200).json(queryResult.rows);
};

const getProject = async (req: Request, res: Response): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);

  const queryString: string = `
    SELECT
      pro.*,
      string_agg(DISTINCT tech.name, ',') as technologies
    FROM
      projects pro
    LEFT JOIN
      projects_technologies ptg ON pro."id" = ptg."projectId"
    LEFT JOIN
      technologies tech ON ptg."technologyId" = tech."id"
    WHERE
      pro.id = $1
    GROUP BY pro.id;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId],
  };

  const queryResult: ProjectResult = await client.query(queryConfig);

  return res.status(200).json(queryResult.rows[0]);
};

const registerNewTech = async (req: Request, res: Response): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);
  const newTech: ITechRequest = req.body;

  if (!newTech.name) {
    return res.status(400).json({
      message: `Erro: 'name' is required`,
    });
  }

  let queryString: string = `
    SELECT 
      *
    FROM
      technologies
    WHERE
      name = $1;
  `;
  const queryConfigCheck: QueryConfig = {
    text: queryString,
    values: [newTech.name],
  };

  const queryResultCheck: QueryResult = await client.query(queryConfigCheck);

  if (queryResultCheck.rowCount === 0) {
    return res.status(400).json({
      message: "Erro: technology not found",
    });
  }

  queryString = `
    INSERT INTO
      projects_technologies ("addedIn", "projectId", "technologyId")
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const newDate = new Date();

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [newDate, projectId, queryResultCheck.rows[0].id],
  };

  const queryResult: TechResult = await client.query(queryConfig);

  return res.status(201).json(queryResult.rows[0]);
};

const editProject = async (req: Request, res: Response): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);
  const projectInfoBody: IProjectRequest = req.body;

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

  const queryResult: ProjectResult = await client.query(queryConfig);

  return res.status(200).json(queryResult.rows[0]);
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

const deleteTechnologyFromProject = async (req: Request, res: Response): Promise<Response> => {
  const projectId: number = parseInt(req.params.id);
  const techName: string = req.params.name.toUpperCase();

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

  await client.query(queryConfig);

  return res.status(200).json();
};

export { registerNewProject, getAllProjects, getProject, registerNewTech, editProject, deleteProject, deleteTechnologyFromProject };
