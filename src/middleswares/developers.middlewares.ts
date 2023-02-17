import { Request, Response, NextFunction } from "express";
import { QueryConfig } from "pg";
import { client } from "../database";
import { DeveloperRequiredKeys, DeveloperResult } from "../interfaces/developers.interfaces";

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
      message: "Developer not found.",
    });
  }

  return next();
};

const validateDeveloperBodyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const developerReqBody = req.body;
  const developerReqBodyKeys: Array<string> = Object.keys(req.body);
  const developerRequiredKeys: Array<DeveloperRequiredKeys | string> = ["name", "email"];

  developerReqBodyKeys.forEach((key) => {
    !developerRequiredKeys.includes(key) && delete developerReqBody[key];
  });

  const validateKeys = developerRequiredKeys.some((key) => developerReqBodyKeys.includes(key));

  if (req.method === "PATCH" && !validateKeys) {
    return res.status(400).json({
      message: "At least one of those keys must be send.",
      keys: ["name", "email"],
    });
  }

  if (req.method === "POST") {
    if (!developerReqBody.name) {
      return res.status(400).json({
        message: "Missing required keys: name.",
      });
    }

    if (!developerReqBody.email) {
      return res.status(400).json({
        message: "Missing required keys: email.",
      });
    }
  }

  return next();
};

const validateInfoBodyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const developerInfoBody = req.body;
  const developerInfoKeys = Object.keys(req.body);
  const developerInfoRequiredKeys = ["developerSince", "preferredOS"];
  const developerRequiredOS = ["Windows", "Linux", "MacOS"];

  if (developerInfoBody.developerSince) {
    developerInfoBody.developerSince = new Date(Date.parse(developerInfoBody.developerSince));
  }

  const validateKeys = developerInfoRequiredKeys.some((key) => developerInfoKeys.includes(key));

  if (req.method === "PATCH" && !validateKeys) {
    return res.status(400).json({
      message: "At least one of those keys must be send.",
      keys: ["developerSince", "preferredOS"],
    });
  }

  if (req.method === "POST") {
    if (!developerInfoBody.developerSince) {
      return res.status(400).json({
        message: "Missing required keys: developerSince.",
      });
    }

    if (!developerInfoBody.preferredOS) {
      return res.status(400).json({
        message: "Missing required keys: preferredOS.",
      });
    }
  }

  if (developerInfoBody.preferredOS && !developerRequiredOS.includes(developerInfoBody.preferredOS)) {
    return res.status(400).json({
      message: "Invalid OS option.",
      options: ["Windows", "Linux", "MacOS"],
    });
  }

  return next();
};

export { ensureDeveloperExists, validateDeveloperBodyMiddleware, validateInfoBodyMiddleware };
