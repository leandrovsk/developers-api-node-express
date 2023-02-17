import { Request, Response } from "express";
import { QueryConfig, QueryResult } from "pg";
import format from "pg-format";
import { client } from "../database";
import { DeveloperProjectsResult, DeveloperResult, DevInfoResult, IDeveloperRequest, IDevInfoRequest } from "../interfaces/developers.interfaces";

const registerNewDeveloper = async (req: Request, res: Response): Promise<Response> => {
  const developerReqBody: IDeveloperRequest = {
    name: req.body.name,
    email: req.body.email,
  };

  const queryString: string = format(
    `
      INSERT INTO
        developers (%I)
      VALUES (%L)
      RETURNING *;
    `,
    Object.keys(developerReqBody),
    Object.values(developerReqBody)
  );

  try {
    const queryResult: DeveloperResult = await client.query(queryString);

    return res.status(201).json(queryResult.rows[0]);
  } catch (error: any) {
    if (error.message.includes("duplicate key value violates unique constraint")) {
      return res.status(409).json({
        message: "Email already exists.",
      });
    }
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getAllDevelopers = async (req: Request, res: Response): Promise<Response> => {
  const queryString: string = `
  SELECT
    de."id" AS "developerID",
    de."name" AS "developerName",
    de."email" AS "developerEmail",
    dinf."id" AS "developerInfoID",
    dinf."developerSince" AS "developerInfoDeveloperSince",
    dinf."preferredOS" AS "developerInfoPreferredOS"
  FROM
    developers de
  LEFT JOIN
    developer_infos dinf ON de."developerInfoId" = dinf.id;
  `;

  const queryResult: DeveloperResult = await client.query(queryString);

  return res.status(200).json(queryResult.rows);
};

const getDeveloper = async (req: Request, res: Response): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);

  const queryString: string = `
    SELECT
      de."id" AS "developerID",
      de."name" AS "developerName",
      de."email" AS "developerEmail",
      dinf."id" AS "developerInfoID",
      dinf."developerSince" AS "developerInfoDeveloperSince",
      dinf."preferredOS" AS "developerInfoPreferredOS"
    FROM
      developers de
    LEFT JOIN
      developer_infos dinf ON de."developerInfoId" = dinf.id
    WHERE
      de.id = $1
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  const queryResult: DeveloperResult = await client.query(queryConfig);

  return res.status(200).json(queryResult.rows[0]);
};

const editDeveloper = async (req: Request, res: Response): Promise<Response> => {
  const developerId = parseInt(req.params.id);
  let developerReqBody: IDeveloperRequest = req.body;

  if (developerReqBody.email && developerReqBody.name) {
    developerReqBody = {
      name: developerReqBody.name,
      email: developerReqBody.email,
    };
  } else if (developerReqBody.name) {
    developerReqBody = {
      name: developerReqBody.name,
    };
  } else {
    developerReqBody = {
      email: developerReqBody.email!,
    };
  }

  const queryString: string = format(
    `
      UPDATE
        developers
      SET(%I) = ROW(%L)
      WHERE
        id = $1
      RETURNING *;
    `,
    Object.keys(developerReqBody),
    Object.values(developerReqBody)
  );

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  try {
    const queryResult: DeveloperResult = await client.query(queryConfig);

    return res.status(200).json(queryResult.rows[0]);
  } catch (error: any) {
    if (error.message.includes("duplicate key value violates unique constraint")) {
      return res.status(409).json({
        message: "Email already exists.",
      });
    }
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const listAllDevProjects = async (req: Request, res: Response): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);

  const queryString = `
  SELECT
    de."id" AS "developerID",
    de."name" AS "developerName",
    de."email" AS "developerEmail",
    dinf."id" AS "developerInfoID",
    dinf."developerSince" AS "developerInfoDeveloperSince",
    dinf."preferredOS" AS "developerInfoPreferredOS",
    pro.id AS "projectId",
    pro.name AS "projectName",
    pro.description AS "projectDescription",
    pro."estimatedTime" as "projectEstimatedTime",
    pro.repository AS "projectRepository",
    pro."startDate" AS "projectStartDate",
    pro."endDate" AS "projectEndDate",
    tech.id AS "technologyId",
    tech.name AS "technologyName"
  FROM
    developers de
  LEFT JOIN
    projects pro ON pro."id" = de."id"
  LEFT JOIN
    developer_infos dinf ON de."developerInfoId" = dinf.id
  LEFT JOIN
    projects_technologies ptg ON pro."id" = ptg."projectId"
  LEFT JOIN
    technologies tech ON ptg."technologyId" = tech."id"
  WHERE
    de.id = $1;
  `;

  const queryConfigProjects: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  const queryResult: DeveloperProjectsResult = await client.query(queryConfigProjects);

  return res.status(200).json(queryResult.rows);
};

const registerNewDevInfo = async (req: Request, res: Response): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);
  const newInfoReqBody: IDevInfoRequest = {
    developerSince: req.body.developerSince,
    preferredOS: req.body.preferredOS,
  };

  let queryString: string = `
    SELECT
      *
    FROM
      developers
    WHERE
      id = $1
  `;

  const queryConfigDevInfoCheck: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  const queryResultDevInfoCheck: DeveloperResult = await client.query(queryConfigDevInfoCheck);

  if (queryResultDevInfoCheck.rows[0].developerInfoId !== null) {
    return res.status(400).json({
      message: "Developer infos already exists.",
    });
  }

  queryString = format(
    `
    INSERT INTO
      developer_infos (%I)
    VALUES (%L)
    RETURNING *;
  `,
    Object.keys(newInfoReqBody),
    Object.values(newInfoReqBody)
  );

  const queryResultInfo: DevInfoResult = await client.query(queryString);

  queryString = `
    UPDATE
      developers
    SET 
      "developerInfoId" = $1
    WHERE
      id = $2;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [queryResultInfo.rows[0].id, developerId],
  };

  await client.query(queryConfig);

  return res.status(201).json(queryResultInfo.rows[0]);
};

const editDeveloperInfo = async (req: Request, res: Response): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);
  let developerInfoBody: IDevInfoRequest = req.body;

  if (developerInfoBody.developerSince && developerInfoBody.preferredOS) {
    developerInfoBody = {
      preferredOS: developerInfoBody.preferredOS,
      developerSince: developerInfoBody.developerSince,
    };
  } else if (developerInfoBody.preferredOS) {
    developerInfoBody = {
      preferredOS: developerInfoBody.preferredOS,
    };
  } else {
    developerInfoBody = {
      developerSince: developerInfoBody.developerSince!,
    };
  }

  let queryString: string = `
    SELECT
      *
    FROM
      developers
    WHERE
      id = $1;
  `;

  const queryConfigDeveloper: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  const queryResultDeveloper: DeveloperResult = await client.query(queryConfigDeveloper);

  queryString = format(
    `
      UPDATE
        developer_infos
      SET(%I) = ROW(%L)
      WHERE
        id = $1
      RETURNING *;
  `,
    Object.keys(developerInfoBody),
    Object.values(developerInfoBody)
  );

  const queryConfigInfo: QueryConfig = {
    text: queryString,
    values: [queryResultDeveloper.rows[0].developerInfoId],
  };

  let queryResultInfo: QueryResult = await client.query(queryConfigInfo);


  return res.status(200).json(queryResultInfo.rows[0]);
};

const deleteDeveloper = async (req: Request, res: Response): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);

  const queryString: string = `
    DELETE FROM
      developers
    WHERE
      id = $1;
  `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  await client.query(queryConfig);

  return res.status(200).json();
};

export { registerNewDeveloper, getAllDevelopers, getDeveloper, registerNewDevInfo, editDeveloper, editDeveloperInfo, listAllDevProjects, deleteDeveloper };
