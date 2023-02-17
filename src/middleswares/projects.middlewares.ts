import { Request, Response, NextFunction } from "express";
import { QueryConfig } from "pg";
import { client } from "../database";
import { projectRequiredKeys, ProjectResult } from "../interfaces/projects.interfaces";

const ensureProjectExists = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const projectId: number = parseInt(req.params.id);

  const queryString: string = `
    SELECT
      *
    FROM
      projects
    WHERE
      id = $1
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId],
  };

  const queryResult: ProjectResult = await client.query(queryConfig);

  if (queryResult.rowCount === 0) {
    return res.status(404).json({
      message: "Project not found.",
    });
  }

  return next();
};

const validateProjectBodyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const projectInfoBody = req.body;
  const projectInfoKeys: Array<string> = Object.keys(req.body);
  const projectRequiredKeys: Array<projectRequiredKeys | string> = ["name", "description", "estimatedTime", "repository", "startDate", "endDate", "developerId"];

  if (projectInfoBody.startDate) {
    projectInfoBody.startDate = new Date(Date.parse(projectInfoBody.startDate));
  }

  if (projectInfoBody.endDate) {
    projectInfoBody.endDate = new Date(Date.parse(projectInfoBody.endDate));
  }

  projectInfoKeys.forEach((key) => {
    !projectRequiredKeys.includes(key) && delete projectInfoBody[key];
  });

  let missingKeys: Array<string> = [];

  const validateKeys = projectRequiredKeys.some((key) => projectInfoKeys.includes(key));

  if (req.method === "PATCH" && !validateKeys) {
    return res.status(400).json({
      message: "At least one of those keys must be send.",
      keys: projectRequiredKeys,
    });
  }

  if (req.method === "POST") {
    projectRequiredKeys.forEach((key) => {
      !projectInfoKeys.includes(key) && key !== "endDate" && missingKeys.push(key);
    });

    if (missingKeys.length !== 0) {
      return res.status(400).json({
        message: `Missing required keys: ${missingKeys}`,
      });
    }
  }

  return next();
};

const validateTechBodyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const projectId: number = parseInt(req.params.id);
  const techReqBody = req.body;
  const techInfoKeys = Object.keys(req.body);
  const techInfoRequiredKey = ["name"];
  const requiredTechnologies = ["JavaScript", "Python", "React", "Express.js", "HTML", "CSS", "Django", "PostgreSQL", "MongoDB"];

  techInfoKeys.forEach((key) => {
    !techInfoRequiredKey.includes(key) && delete techReqBody[key];
  });

  if (!techReqBody.name) {
    return res.status(400).json({
      message: "A key 'name' must be send.",
    });
  }

  const validateTechName = requiredTechnologies.some((tech) => techReqBody.name === tech);

  if (!validateTechName) {
    return res.status(400).json({
      message: "Technology not supported.",
      options: requiredTechnologies,
    });
  }

  const queryString: string = `
    SELECT
      ptch.*,
      tech.name
    FROM
      projects_technologies ptch
    LEFT JOIN
      technologies tech ON ptch."technologyId" = tech.id
    WHERE
      "projectId" = $1 AND tech.name = $2;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [projectId, techReqBody.name],
  };

  const queryResult = await client.query(queryConfig);

  if (queryResult.rowCount !== 0) {
    return res.status(409).json({
      message: "Technology already registered",
    });
  }

  return next();
};

export { ensureProjectExists, validateProjectBodyMiddleware, validateTechBodyMiddleware };
