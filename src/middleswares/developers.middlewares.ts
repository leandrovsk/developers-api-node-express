import { Request, Response, NextFunction } from "express";
import { QueryConfig } from "pg";
import { client } from "../database";
import { DeveloperResult } from "../interfaces/developers.interfaces";

const ensureDeveloperExists = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const developerId: number = parseInt(req.params.id);

  const queryString = `
    SELECT
      *
    FROM
      developers
    WHERE
      id = $1;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  const queryResult: DeveloperResult = await client.query(queryConfig);

  if (queryResult.rowCount === 0) {
    return res.status(404).json({
      message: `Error: developer 'id' not found`,
    });
  }

  return next();
};

const validateDeveloperBodyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const developerKeys = Object.keys(req.body);
  const developerRequiredKeys = ["name", "email"];

  let validateKeys = developerRequiredKeys.every((key) => developerKeys.includes(key));

  let checkWrongKeys = developerKeys.some((key) => !developerRequiredKeys.includes(key));

  if (req.method === "PATCH") {
    validateKeys = developerRequiredKeys.some((key) => developerKeys.includes(key));
  }

  if (!validateKeys || checkWrongKeys) {
    return res.status(400).json({
      message: `Error: required keys are ${developerRequiredKeys}`,
    });
  }

  return next();
};

const validateInfoBodyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const developerInfoKeys = Object.keys(req.body);
  const developerInfoRequiredKeys = ["developerSince", "preferredOS"];

  let validateKeys = developerInfoRequiredKeys.every((key) => developerInfoKeys.includes(key));

  let checkWrongKeys = developerInfoKeys.some((key) => !developerInfoRequiredKeys.includes(key));

  if (req.method === "PATCH") {
    validateKeys = developerInfoRequiredKeys.some((key) => developerInfoKeys.includes(key));
  }

  if (!validateKeys || checkWrongKeys) {
    return res.status(400).json({
      message: `Error: required keys are ${developerInfoRequiredKeys}`,
    });
  }

  return next();
};

export { ensureDeveloperExists, validateDeveloperBodyMiddleware, validateInfoBodyMiddleware };
