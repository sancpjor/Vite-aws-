import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled } from "@aws-amplify/datastore";





type EagerLeaderboardEntry = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<LeaderboardEntry, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly alias: string;
  readonly email: string;
  readonly score: number;
  readonly totalQuestions: number;
  readonly percentage: number;
  readonly date: string;
  readonly time: string;
  readonly timestamp: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyLeaderboardEntry = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<LeaderboardEntry, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly alias: string;
  readonly email: string;
  readonly score: number;
  readonly totalQuestions: number;
  readonly percentage: number;
  readonly date: string;
  readonly time: string;
  readonly timestamp: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type LeaderboardEntry = LazyLoading extends LazyLoadingDisabled ? EagerLeaderboardEntry : LazyLeaderboardEntry

export declare const LeaderboardEntry: (new (init: ModelInit<LeaderboardEntry>) => LeaderboardEntry) & {
  copyOf(source: LeaderboardEntry, mutator: (draft: MutableModel<LeaderboardEntry>) => MutableModel<LeaderboardEntry> | void): LeaderboardEntry;
}

type EagerQuizStats = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuizStats, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly totalUsers: number;
  readonly playedUsers: number;
  readonly totalAttempts: number;
  readonly averageScore: number;
  readonly perfectScores: number;
  readonly completionRate: number;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyQuizStats = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuizStats, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly totalUsers: number;
  readonly playedUsers: number;
  readonly totalAttempts: number;
  readonly averageScore: number;
  readonly perfectScores: number;
  readonly completionRate: number;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type QuizStats = LazyLoading extends LazyLoadingDisabled ? EagerQuizStats : LazyQuizStats

export declare const QuizStats: (new (init: ModelInit<QuizStats>) => QuizStats) & {
  copyOf(source: QuizStats, mutator: (draft: MutableModel<QuizStats>) => MutableModel<QuizStats> | void): QuizStats;
}