import { HttpClient } from './http.js';
import type { RoyaltyportConfig, ApiResponse } from './types/common.js';
import type { SearchResult } from './types/search.js';
import { Projects } from './resources/projects.js';
import { Artists } from './resources/artists.js';
import { Writers } from './resources/writers.js';
import { Recordings } from './resources/recordings.js';
import { Compositions } from './resources/compositions.js';
import { Entities } from './resources/entities.js';
import { Relations } from './resources/relations.js';
import { Contracts } from './resources/contracts.js';
import { Statements } from './resources/statements.js';

const DEFAULT_BASE_URL = 'https://api.royaltyport.com';

export class Royaltyport {
  private readonly _http: HttpClient;

  private _projects?: Projects;
  private _artists?: Artists;
  private _writers?: Writers;
  private _recordings?: Recordings;
  private _compositions?: Compositions;
  private _entities?: Entities;
  private _relations?: Relations;
  private _contracts?: Contracts;
  private _statements?: Statements;

  constructor(config: RoyaltyportConfig) {
    this._http = new HttpClient({
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      token: config.apiKey,
      fetch: config.fetch ?? globalThis.fetch,
    });
  }

  get projects(): Projects {
    return (this._projects ??= new Projects(this._http));
  }

  get artists(): Artists {
    return (this._artists ??= new Artists(this._http));
  }

  get writers(): Writers {
    return (this._writers ??= new Writers(this._http));
  }

  get recordings(): Recordings {
    return (this._recordings ??= new Recordings(this._http));
  }

  get compositions(): Compositions {
    return (this._compositions ??= new Compositions(this._http));
  }

  get entities(): Entities {
    return (this._entities ??= new Entities(this._http));
  }

  get relations(): Relations {
    return (this._relations ??= new Relations(this._http));
  }

  get contracts(): Contracts {
    return (this._contracts ??= new Contracts(this._http));
  }

  get statements(): Statements {
    return (this._statements ??= new Statements(this._http));
  }

  async search(projectId: string, query: string): Promise<ApiResponse<SearchResult>> {
    return this._http.get(`/projects/${projectId}/search`, { q: query });
  }
}
