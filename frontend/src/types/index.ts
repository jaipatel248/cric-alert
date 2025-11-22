export interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
}

// Alert types from LLM
export type AlertType = 'SOFT_ALERT' | 'HARD_ALERT' | 'TRIGGER' | 'ABORTED' | 'INFO';

// Monitor lifecycle status
export type MonitorStatus = 
  | 'initializing'  // Monitor being initialized, rule parsing in progress
  | 'monitoring'    // Active, no alerts yet
  | 'approaching'   // Has SOFT_ALERT, still monitoring
  | 'imminent'      // Has HARD_ALERT, very close to target
  | 'triggered'     // Target reached (TRIGGER alert)
  | 'aborted'       // Cannot reach target (ABORTED alert)
  | 'completed'     // Match ended
  | 'stopped'       // Manually stopped
  | 'error'         // Error occurred
  | 'deleted';      // Monitor deleted

export interface MatchHeader {
  matchId: number;
  matchDescription: string;
  matchFormat: string;
  team1: {
    id: number;
    name: string;
    shortName: string;
  };
  team2: {
    id: number;
    name: string;
    shortName: string;
  };
  status: string;
  state: string;
}

export interface TeamScore {
  teamId: number;
  teamScore: number;
  teamWkts: number;
}

export interface Batsman {
  batId: number;
  batName: string;
  batRuns: number;
  batBalls: number;
  batFours: number;
  batSixes: number;
  batStrikeRate: number;
}

export interface Bowler {
  bowlId: number;
  bowlName: string;
  bowlOvs: number;
  bowlMaidens: number;
  bowlRuns: number;
  bowlWkts: number;
  bowlEcon: number;
}

export interface Miniscore {
  inningsId: number;
  batsmanStriker: Batsman;
  batsmanNonStriker: Batsman;
  bowlerStriker: Bowler;
  bowlerNonStriker: Bowler;
  batTeam: TeamScore;
  overs: number;
  recentOvsStats: string;
  target: number;
  partnerShip: {
    balls: number;
    runs: number;
  };
}

export interface MatchStatus {
  match_id: number;
  is_active: boolean;
  match_header?: MatchHeader;
  miniscore?: Miniscore;
  // Simplified fields returned by the backend summary endpoint
  score?: string;
  overs?: number;
  batting_team?: string;
  current_run_rate?: number;
  status?: string;
  state?: string;
}

export interface AlertRule {
  type: string;
  condition?: any;
}

export interface CreateAlertRequest {
  match_id: number;
  alert_text: string;
}
export interface ExpectedNextCheck {
  estimatedMinutes: number;
  estimatedBalls: number;
  reasoning: string;
}

export interface AlertEntity {
  id?: number;
  name?: string;
  teamShort?: string;
}

export interface AlertContext {
  currentValue?: number;
  target?: number;
  runsToTarget?: number;
  ballNbr?: number;
  overNumber?: number;
  event?: string;
  [key: string]: any;
}

export interface RecentAlert {
  type: AlertType;
  entityType?: string;
  entity?: AlertEntity;
  inningsId?: number;
  matchId?: number;
  context?: AlertContext;
  reason?: string;
  message: string;
  timestamp: string;
}

export interface AlertMonitor {
  monitor_id: string;
  match_id: number;
  alert_text: string;
  parsed_rule: AlertRule;
  status: MonitorStatus;
  created_at: string;
  triggered_at?: string;
  triggered_count: number;
  rules?: any;
  running?: boolean;
  alerts_count?: number;
  last_alert_message?: string;
  expectedNextCheck?: ExpectedNextCheck;
  recent_alerts?: RecentAlert[];
}

export interface AlertResponse {
  monitor_id: string;
  match_id: number;
  alert_text: string;
  status: MonitorStatus;
  message: string;
  rules?: any;
  created_at: string;
}
