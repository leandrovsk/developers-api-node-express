import { QueryResult } from "pg";

interface IDeveloperRequest {
  name?: string;
  email?: string;
}

type OS = "Windows" | "Linux" | "MacOS";

type DeveloperRequiredKeys = "name" | "email";

interface IDeveloper extends IDeveloperRequest {
  id: number;
  developerInfoId?: number | null;
  developerSince?: Date;
  preferredOS?: OS;
}

type DeveloperResult = QueryResult<IDeveloper>;

interface IDevInfoRequest {
  developerSince?: Date;
  preferredOS?: OS;
}

interface IDevInfo extends IDevInfoRequest {
  id: number;
}

type DevInfoResult = QueryResult<IDevInfo>;

interface IDeveloperProject {
  projectName: string;
  projectId: number;
  description: string;
  estimatedTime: string;
  repository: string;
  startDate: Date;
  endDate: Date | null;
  technologies: string;
}

type DeveloperProjectsResult = QueryResult<IDeveloperProject>;

export { IDeveloperRequest, DeveloperResult, IDevInfoRequest, DevInfoResult, DeveloperProjectsResult, DeveloperRequiredKeys };
