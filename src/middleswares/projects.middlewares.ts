import { Request, Response, NextFunction } from "express";
import { QueryConfig } from "pg";
import { client } from "../database";
import { ProjectResult } from "../interfaces/projects.interfaces";

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
      message: `Error: project 'id' not found`,
    });
  }

  return next();
};

const validateProjectBodyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const projectInfoKeys = Object.keys(req.body);
  const projectInfoRequiredKeys = ["name", "description", "estimatedTime", "repository", "startDate", "developerId"];
  const projectInfoRequiredKeysPlus = ["name", "description", "estimatedTime", "repository", "startDate", "developerId", "endDate"];

  let validateKeys = projectInfoRequiredKeys.every((key) => projectInfoKeys.includes(key));

  let checkWrongKeys = projectInfoKeys.some((key) => !projectInfoRequiredKeysPlus.includes(key));

  if (req.method === "PATCH") {
    validateKeys = projectInfoRequiredKeys.some((key) => projectInfoKeys.includes(key));
  }

  if (!validateKeys || checkWrongKeys) {
    return res.status(400).json({
      message: `Error: required keys are ${projectInfoRequiredKeys}`,
    });
  }

  return next();
};

const validateTechBodyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const techInfoKeys = Object.keys(req.body);
  const techInfoRequiredKey = ["name"];

  let validateKeys = techInfoRequiredKey.every((key) => techInfoKeys.includes(key));

  let checkWrongKeys = techInfoKeys.some((key) => !techInfoRequiredKey.includes(key));

  if (!validateKeys || checkWrongKeys) {
    return res.status(400).json({
      message: `Error: required keys is ${techInfoRequiredKey}`,
    });
  }

  return next();
};

export { ensureProjectExists, validateProjectBodyMiddleware, validateTechBodyMiddleware };
