import { QueryResult } from "pg";

interface IProjectRequest {
  name: string;
  description: string;
  estimatedTime: string;
  repository: string;
  startDate: Date;
  endDate?: Date;
  developerId: number;
}

interface IProject extends IProjectRequest {
  id: number;
}

type ProjectResult = QueryResult<IProject>;

interface ITechRequest {
  name: string;
}

interface ITech extends ITechRequest {
  id: number;
  addedIn: Date;
  projectId: number;
  technologyId: number;
}

type TechResult = QueryResult<ITech>;

export { IProjectRequest, ProjectResult, ITechRequest, TechResult };
