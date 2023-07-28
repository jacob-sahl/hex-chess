import { GameState } from './State/Slices/gameSlice';

export enum PieceType {
  pawn,
  knight,
  bishop,
  rook,
  queen,
  king,
}

export type GridCoordinate = {
  col: number;
  row: number;
};

export type AxialCoordinate = {
  q: number;
  r: number;
};

export enum PieceOwner {
  black,
  white,
}

export type Piece = {
  id: string;
  tag: string;
  type: PieceType;
  pos: GridCoordinate;
  axial: AxialCoordinate;
  hasMoved: boolean;
  owner: PieceOwner;
};

export enum TileStatusType {
  whiteThreatening,
  blackThreatening,
  enPassantBlack,
  enPassantWhite,
  whitePawnOrigin,
  blackPawnOrigin,
  moveHighlight,
  captureHighlight,
  whitePromoTile,
  blackPromoTile,
}

export type TileStatus = {
  type: TileStatusType;
};

export enum MoveType {
  standard,
  capture,
  enPassantCapture,
  promotion,
}

export type MoveInfo = {
  axial: AxialCoordinate;
  type: MoveType;
  source: Piece;
  promoPiece?: Piece;
};

export type SerializedMove = {
  axial: AxialCoordinate;
  type: MoveType;
  sourceTag: string;
  promoPieceType?: PieceType;
};

export type MoveCalculationFunction = (state: GameState, piece: Piece) => MoveInfo[];

export type MoveStatus = TileStatus & {
  move: MoveInfo;
};

export type Tile = {
  id: string;
  pos: GridCoordinate;
  axial: AxialCoordinate;
  content: Piece | null;
  statuses: TileStatus[];
  playable: boolean;
  boundary: boolean;
};

export enum GameOverState {
  unfinished,
  whiteVictory,
  blackVictory,
  whiteStalemated,
  blackStalemated,
}

export enum ZIndices {
  Dialogues = 100,
  Alerts = 1000,
}

export enum Dialogue {
  none,
  promotion,
  CreateGame,
  JoinGame,
  GameLobby,
}

export enum PlayerSide {
  white,
  black,
  random,
}

export enum AlertSeverity {
  success = 'green',
  warning = 'orange',
  info = 'blue',
  error = 'red',
}

export type Alert = {
  id: string;
  content: string;
  severity: AlertSeverity;
  alive: boolean;
};

export enum NextTurnSource {
  Reset,
  Local,
  Online,
}
