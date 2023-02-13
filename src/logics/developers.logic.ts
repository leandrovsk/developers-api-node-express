import { Request, Response } from "express";
import { QueryConfig, QueryResult } from "pg";
import format from "pg-format";
import { client } from "../database";
import { DeveloperProjectsResult, DeveloperResult, DevInfoResult, IDeveloperRequest, IDevInfoRequest } from "../interfaces/developers.interfaces";

const registerNewDeveloper = async (req: Request, res: Response): Promise<Response> => {
  const developerReqBody: IDeveloperRequest = req.body;

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

  const queryResult: DeveloperResult = await client.query(queryString);

  return res.status(201).json(queryResult.rows[0]);
};

const getAllDevelopers = async (req: Request, res: Response): Promise<Response> => {
  const queryString: string = `
  SELECT
    de."id",
    de."name",
    de."email",
    dinf."developerSince",
    dinf."preferredOS"
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
      de."id",
      de."name",
      de."email",
      dinf."developerSince",
      dinf."preferredOS"
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

const registerNewDevInfo = async (req: Request, res: Response): Promise<Response> => {
  const devId: number = parseInt(req.params.id);
  const newInfoReqBody: IDevInfoRequest = req.body;

  let queryString: string = format(
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
    values: [queryResultInfo.rows[0].id, devId],
  };

  await client.query(queryConfig);

  return res.status(201).json(queryResultInfo.rows[0]);
};

const editDeveloper = async (req: Request, res: Response): Promise<Response> => {
  const devId = parseInt(req.params.id);
  const developerReqBody: IDeveloperRequest = req.body;

  if (req.body.id) {
    return res.status(400).json({
      message: `Erro: cannot update 'id' field`,
    });
  }

  let queryString: string = format(
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
    values: [devId],
  };

  let queryResult: DeveloperResult = await client.query(queryConfig);

  delete queryResult.rows[0].developerInfoId;

  return res.status(200).json(queryResult.rows[0]);
};

const listAllDevProjects = async (req: Request, res: Response): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);

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

  queryString = `
  SELECT
    pro.name as "projectName",
    pro.id as "projectId",
    pro.description,
    pro."estimatedTime",
    pro.repository,
    pro."startDate",
    pro."endDate",
    string_agg(DISTINCT tech.name, ',') as technologies
  FROM
    projects pro
  LEFT JOIN
    projects_technologies ptg ON pro."id" = ptg."projectId"
  LEFT JOIN
    technologies tech ON ptg."technologyId" = tech."id"
  WHERE
    "developerId" = $1
  GROUP BY pro.id;
  `;

  const queryConfigProjects: QueryConfig = {
    text: queryString,
    values: [developerId],
  };

  const queryResultProjects: DeveloperProjectsResult = await client.query(queryConfigProjects);

  const response = { developer: { ...queryResultDeveloper.rows[0] }, projects: queryResultProjects.rows };

  return res.status(200).json(response);
};

const editDeveloperInfo = async (req: Request, res: Response): Promise<Response> => {
  const developerId: number = parseInt(req.params.id);
  const developerInfoBody: IDevInfoRequest = req.body;

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

  delete queryResultInfo.rows[0].id;
  delete queryResultDeveloper.rows[0].developerInfoId;

  let queryResult = {
    ...queryResultDeveloper.rows[0],
    ...queryResultInfo.rows[0],
  };

  return res.status(200).json(queryResult);
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
