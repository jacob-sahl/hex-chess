import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import {
  AxialCoordinate,
  GameOverState,
  MoveStatus,
  MoveType,
  Piece,
  PieceOwner,
  PieceType,
  Tile,
  TileStatusType,
} from '../../types';
import { createBishop } from '../Pieces/Bishop';
import { createKnight } from '../Pieces/Knight';
import { createQueen } from '../Pieces/Queen';
import { createRook } from '../Pieces/Rook';
import {
  AxialToGrid,
  CaptureContent,
  CheckForPawnPromotion,
  ClearMoveHighlights,
  EndTurn,
  GetCurrentPlayer,
  GetTileAtAxial,
  HandlePawnDoubleMove,
  ResetGameBoard,
  StartTurn,
  createTile,
} from './helpers';

export interface GameState {
  gameOverState: GameOverState;
  board: Tile[][];
  selected: Tile | null;
  turn: number;
  pawnPromotionFlag: boolean;
  promotionTile: Tile | null;
}

export const emptyBoard: Tile[][] = [];

for (let i = 0; i < 11; i++) {
  emptyBoard.push([]);
  for (let j = 0; j < 11; j++) {
    emptyBoard[i].push(createTile({ col: i, row: j }));
  }
}

const initialGameState: GameState = {
  gameOverState: GameOverState.unfinished,
  board: emptyBoard,
  selected: null,
  turn: 0,
  pawnPromotionFlag: false,
  promotionTile: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState: initialGameState,
  reducers: {
    resetBoard: (state: GameState) => {
      console.log('Resetting Board');
      state.turn = 0;
      ResetGameBoard(state);
      EndTurn(state);
      StartTurn(state);
    },
    highlightMoves: (state: GameState, action: PayloadAction<Piece>) => {
      ClearMoveHighlights(state);
      for (const col of state.board) {
        for (const tile of col) {
          tile.statuses.forEach((status) => {
            if ('move' in status) {
              let s = status as MoveStatus;
              if (s.move.source.id === action.payload.id) {
                if (s.move.type === MoveType.capture || s.move.type === MoveType.enPassantCapture) {
                  tile.statuses.push({ type: TileStatusType.captureHighlight } as MoveStatus);
                } else {
                  tile.statuses.push({ type: TileStatusType.moveHighlight } as MoveStatus);
                }
              }
            }
          });
        }
      }
    },
    unhighlightMoves: (state: GameState, action: PayloadAction<Piece>) => {
      for (const col of state.board) {
        for (const tile of col) {
          tile.statuses = tile.statuses.filter((status) => {
            if ('move' in status) {
              let s = status as MoveStatus;
              return s.move.source.id === action.payload.id;
            } else {
              return true;
            }
          });
        }
      }
    },
    unhighlightAllMoves: (state: GameState) => {
      ClearMoveHighlights(state);
    },
    selectTile: (state: GameState, action: PayloadAction<Tile | null>) => {
      state.selected = action.payload;
    },
    attemptMove: (state: GameState, action: PayloadAction<AxialCoordinate>) => {
      if (state.selected === null) return;
      if (state.selected.content === null) return;
      const mover = state.selected.content;

      // Make sure it is the turn of the selected piece
      if (mover.owner === PieceOwner.black && state.turn % 2 === 1) return;
      if (mover.owner === PieceOwner.white && state.turn % 2 === 0) return;

      const targetTile = GetTileAtAxial(state, action.payload);
      if (targetTile === undefined) return;
      if (
        targetTile.statuses.some((status) => {
          if ('move' in status) {
            let s = status as MoveStatus;
            return s.move.source.id === mover.id;
          } else {
            return false;
          }
        })
      ) {
        const moveStatus = targetTile.statuses.find((status) => {
          if ('move' in status) {
            let s = status as MoveStatus;
            return s.move.source.id === mover.id;
          } else {
            return false;
          }
        }) as MoveStatus;
        // MOVE!
        CaptureContent(state, targetTile);

        // En-passant capturing
        if (moveStatus.move.type === MoveType.enPassantCapture) {
          if (mover.owner === PieceOwner.black) {
            const epAxial: AxialCoordinate = { q: targetTile.axial.q, r: targetTile.axial.r - 1 };
            const epPos = AxialToGrid(epAxial);
            const enPassantTile = state.board[epPos.col][epPos.row];
            CaptureContent(state, enPassantTile);
          } else {
            const epAxial: AxialCoordinate = { q: targetTile.axial.q, r: targetTile.axial.r + 1 };
            const epPos = AxialToGrid(epAxial);
            const enPassantTile = state.board[epPos.col][epPos.row];
            CaptureContent(state, enPassantTile);
          }
        }

        // Lift-off
        const originAxial: AxialCoordinate = { q: mover.axial.q, r: mover.axial.r };
        state.board[mover.pos.col][mover.pos.row].content = null;

        // Touch-down
        targetTile.content = mover;
        mover.pos = targetTile.pos;
        mover.axial = targetTile.axial;

        HandlePawnDoubleMove(state, mover, targetTile, originAxial);

        if (CheckForPawnPromotion(state, mover, targetTile)) {
          state.pawnPromotionFlag = true;
          state.promotionTile = targetTile;
        } else {
          EndTurn(state);
          StartTurn(state);
        }
      }
    },
    executePromotePiece: (state: GameState, action: PayloadAction<PieceType>) => {
      const promoPlayer = GetCurrentPlayer(state);
      const promoPos = state.promotionTile!.pos;
      let newPiece: Piece;
      switch (action.payload) {
        case PieceType.bishop:
          newPiece = createBishop(promoPos, promoPlayer);
          break;
        case PieceType.knight:
          newPiece = createKnight(promoPos, promoPlayer);
          break;
        case PieceType.rook:
          newPiece = createRook(promoPos, promoPlayer);
          break;
        default:
          newPiece = createQueen(promoPos, promoPlayer);
          break;
      }
      state.board[promoPos.col][promoPos.row].content = newPiece;

      state.pawnPromotionFlag = false;
      state.promotionTile = null;

      // And now we end the turn
      EndTurn(state);
      StartTurn(state);
    },
  },
});

export default gameSlice.reducer;
export const {
  resetBoard,
  highlightMoves,
  unhighlightMoves,
  selectTile,
  unhighlightAllMoves,
  attemptMove,
  executePromotePiece,
} = gameSlice.actions;
