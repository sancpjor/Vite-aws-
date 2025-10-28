/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateLeaderboardEntryInput = {
  id?: string | null,
  alias: string,
  email: string,
  score: number,
  totalQuestions: number,
  percentage: number,
  date: string,
  time: string,
  timestamp: string,
};

export type ModelLeaderboardEntryConditionInput = {
  alias?: ModelStringInput | null,
  email?: ModelStringInput | null,
  score?: ModelIntInput | null,
  totalQuestions?: ModelIntInput | null,
  percentage?: ModelFloatInput | null,
  date?: ModelStringInput | null,
  time?: ModelStringInput | null,
  timestamp?: ModelStringInput | null,
  and?: Array< ModelLeaderboardEntryConditionInput | null > | null,
  or?: Array< ModelLeaderboardEntryConditionInput | null > | null,
  not?: ModelLeaderboardEntryConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type ModelIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type ModelFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type LeaderboardEntry = {
  __typename: "LeaderboardEntry",
  id: string,
  alias: string,
  email: string,
  score: number,
  totalQuestions: number,
  percentage: number,
  date: string,
  time: string,
  timestamp: string,
  createdAt: string,
  updatedAt: string,
};

export type UpdateLeaderboardEntryInput = {
  id: string,
  alias?: string | null,
  email?: string | null,
  score?: number | null,
  totalQuestions?: number | null,
  percentage?: number | null,
  date?: string | null,
  time?: string | null,
  timestamp?: string | null,
};

export type DeleteLeaderboardEntryInput = {
  id: string,
};

export type CreateQuizStatsInput = {
  id?: string | null,
  totalUsers: number,
  playedUsers: number,
  totalAttempts: number,
  averageScore: number,
  perfectScores: number,
  completionRate: number,
};

export type ModelQuizStatsConditionInput = {
  totalUsers?: ModelIntInput | null,
  playedUsers?: ModelIntInput | null,
  totalAttempts?: ModelIntInput | null,
  averageScore?: ModelFloatInput | null,
  perfectScores?: ModelIntInput | null,
  completionRate?: ModelFloatInput | null,
  and?: Array< ModelQuizStatsConditionInput | null > | null,
  or?: Array< ModelQuizStatsConditionInput | null > | null,
  not?: ModelQuizStatsConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type QuizStats = {
  __typename: "QuizStats",
  id: string,
  totalUsers: number,
  playedUsers: number,
  totalAttempts: number,
  averageScore: number,
  perfectScores: number,
  completionRate: number,
  createdAt: string,
  updatedAt: string,
};

export type UpdateQuizStatsInput = {
  id: string,
  totalUsers?: number | null,
  playedUsers?: number | null,
  totalAttempts?: number | null,
  averageScore?: number | null,
  perfectScores?: number | null,
  completionRate?: number | null,
};

export type DeleteQuizStatsInput = {
  id: string,
};

export type ModelLeaderboardEntryFilterInput = {
  id?: ModelIDInput | null,
  alias?: ModelStringInput | null,
  email?: ModelStringInput | null,
  score?: ModelIntInput | null,
  totalQuestions?: ModelIntInput | null,
  percentage?: ModelFloatInput | null,
  date?: ModelStringInput | null,
  time?: ModelStringInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelLeaderboardEntryFilterInput | null > | null,
  or?: Array< ModelLeaderboardEntryFilterInput | null > | null,
  not?: ModelLeaderboardEntryFilterInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type ModelLeaderboardEntryConnection = {
  __typename: "ModelLeaderboardEntryConnection",
  items:  Array<LeaderboardEntry | null >,
  nextToken?: string | null,
};

export type ModelQuizStatsFilterInput = {
  id?: ModelIDInput | null,
  totalUsers?: ModelIntInput | null,
  playedUsers?: ModelIntInput | null,
  totalAttempts?: ModelIntInput | null,
  averageScore?: ModelFloatInput | null,
  perfectScores?: ModelIntInput | null,
  completionRate?: ModelFloatInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelQuizStatsFilterInput | null > | null,
  or?: Array< ModelQuizStatsFilterInput | null > | null,
  not?: ModelQuizStatsFilterInput | null,
};

export type ModelQuizStatsConnection = {
  __typename: "ModelQuizStatsConnection",
  items:  Array<QuizStats | null >,
  nextToken?: string | null,
};

export type ModelSubscriptionLeaderboardEntryFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  alias?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  score?: ModelSubscriptionIntInput | null,
  totalQuestions?: ModelSubscriptionIntInput | null,
  percentage?: ModelSubscriptionFloatInput | null,
  date?: ModelSubscriptionStringInput | null,
  time?: ModelSubscriptionStringInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionLeaderboardEntryFilterInput | null > | null,
  or?: Array< ModelSubscriptionLeaderboardEntryFilterInput | null > | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionIntInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionQuizStatsFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  totalUsers?: ModelSubscriptionIntInput | null,
  playedUsers?: ModelSubscriptionIntInput | null,
  totalAttempts?: ModelSubscriptionIntInput | null,
  averageScore?: ModelSubscriptionFloatInput | null,
  perfectScores?: ModelSubscriptionIntInput | null,
  completionRate?: ModelSubscriptionFloatInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionQuizStatsFilterInput | null > | null,
  or?: Array< ModelSubscriptionQuizStatsFilterInput | null > | null,
};

export type CreateLeaderboardEntryMutationVariables = {
  input: CreateLeaderboardEntryInput,
  condition?: ModelLeaderboardEntryConditionInput | null,
};

export type CreateLeaderboardEntryMutation = {
  createLeaderboardEntry?:  {
    __typename: "LeaderboardEntry",
    id: string,
    alias: string,
    email: string,
    score: number,
    totalQuestions: number,
    percentage: number,
    date: string,
    time: string,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateLeaderboardEntryMutationVariables = {
  input: UpdateLeaderboardEntryInput,
  condition?: ModelLeaderboardEntryConditionInput | null,
};

export type UpdateLeaderboardEntryMutation = {
  updateLeaderboardEntry?:  {
    __typename: "LeaderboardEntry",
    id: string,
    alias: string,
    email: string,
    score: number,
    totalQuestions: number,
    percentage: number,
    date: string,
    time: string,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteLeaderboardEntryMutationVariables = {
  input: DeleteLeaderboardEntryInput,
  condition?: ModelLeaderboardEntryConditionInput | null,
};

export type DeleteLeaderboardEntryMutation = {
  deleteLeaderboardEntry?:  {
    __typename: "LeaderboardEntry",
    id: string,
    alias: string,
    email: string,
    score: number,
    totalQuestions: number,
    percentage: number,
    date: string,
    time: string,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type CreateQuizStatsMutationVariables = {
  input: CreateQuizStatsInput,
  condition?: ModelQuizStatsConditionInput | null,
};

export type CreateQuizStatsMutation = {
  createQuizStats?:  {
    __typename: "QuizStats",
    id: string,
    totalUsers: number,
    playedUsers: number,
    totalAttempts: number,
    averageScore: number,
    perfectScores: number,
    completionRate: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateQuizStatsMutationVariables = {
  input: UpdateQuizStatsInput,
  condition?: ModelQuizStatsConditionInput | null,
};

export type UpdateQuizStatsMutation = {
  updateQuizStats?:  {
    __typename: "QuizStats",
    id: string,
    totalUsers: number,
    playedUsers: number,
    totalAttempts: number,
    averageScore: number,
    perfectScores: number,
    completionRate: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteQuizStatsMutationVariables = {
  input: DeleteQuizStatsInput,
  condition?: ModelQuizStatsConditionInput | null,
};

export type DeleteQuizStatsMutation = {
  deleteQuizStats?:  {
    __typename: "QuizStats",
    id: string,
    totalUsers: number,
    playedUsers: number,
    totalAttempts: number,
    averageScore: number,
    perfectScores: number,
    completionRate: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type GetLeaderboardEntryQueryVariables = {
  id: string,
};

export type GetLeaderboardEntryQuery = {
  getLeaderboardEntry?:  {
    __typename: "LeaderboardEntry",
    id: string,
    alias: string,
    email: string,
    score: number,
    totalQuestions: number,
    percentage: number,
    date: string,
    time: string,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListLeaderboardEntriesQueryVariables = {
  filter?: ModelLeaderboardEntryFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListLeaderboardEntriesQuery = {
  listLeaderboardEntries?:  {
    __typename: "ModelLeaderboardEntryConnection",
    items:  Array< {
      __typename: "LeaderboardEntry",
      id: string,
      alias: string,
      email: string,
      score: number,
      totalQuestions: number,
      percentage: number,
      date: string,
      time: string,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetQuizStatsQueryVariables = {
  id: string,
};

export type GetQuizStatsQuery = {
  getQuizStats?:  {
    __typename: "QuizStats",
    id: string,
    totalUsers: number,
    playedUsers: number,
    totalAttempts: number,
    averageScore: number,
    perfectScores: number,
    completionRate: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListQuizStatsQueryVariables = {
  filter?: ModelQuizStatsFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListQuizStatsQuery = {
  listQuizStats?:  {
    __typename: "ModelQuizStatsConnection",
    items:  Array< {
      __typename: "QuizStats",
      id: string,
      totalUsers: number,
      playedUsers: number,
      totalAttempts: number,
      averageScore: number,
      perfectScores: number,
      completionRate: number,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateLeaderboardEntrySubscriptionVariables = {
  filter?: ModelSubscriptionLeaderboardEntryFilterInput | null,
};

export type OnCreateLeaderboardEntrySubscription = {
  onCreateLeaderboardEntry?:  {
    __typename: "LeaderboardEntry",
    id: string,
    alias: string,
    email: string,
    score: number,
    totalQuestions: number,
    percentage: number,
    date: string,
    time: string,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateLeaderboardEntrySubscriptionVariables = {
  filter?: ModelSubscriptionLeaderboardEntryFilterInput | null,
};

export type OnUpdateLeaderboardEntrySubscription = {
  onUpdateLeaderboardEntry?:  {
    __typename: "LeaderboardEntry",
    id: string,
    alias: string,
    email: string,
    score: number,
    totalQuestions: number,
    percentage: number,
    date: string,
    time: string,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteLeaderboardEntrySubscriptionVariables = {
  filter?: ModelSubscriptionLeaderboardEntryFilterInput | null,
};

export type OnDeleteLeaderboardEntrySubscription = {
  onDeleteLeaderboardEntry?:  {
    __typename: "LeaderboardEntry",
    id: string,
    alias: string,
    email: string,
    score: number,
    totalQuestions: number,
    percentage: number,
    date: string,
    time: string,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnCreateQuizStatsSubscriptionVariables = {
  filter?: ModelSubscriptionQuizStatsFilterInput | null,
};

export type OnCreateQuizStatsSubscription = {
  onCreateQuizStats?:  {
    __typename: "QuizStats",
    id: string,
    totalUsers: number,
    playedUsers: number,
    totalAttempts: number,
    averageScore: number,
    perfectScores: number,
    completionRate: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateQuizStatsSubscriptionVariables = {
  filter?: ModelSubscriptionQuizStatsFilterInput | null,
};

export type OnUpdateQuizStatsSubscription = {
  onUpdateQuizStats?:  {
    __typename: "QuizStats",
    id: string,
    totalUsers: number,
    playedUsers: number,
    totalAttempts: number,
    averageScore: number,
    perfectScores: number,
    completionRate: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteQuizStatsSubscriptionVariables = {
  filter?: ModelSubscriptionQuizStatsFilterInput | null,
};

export type OnDeleteQuizStatsSubscription = {
  onDeleteQuizStats?:  {
    __typename: "QuizStats",
    id: string,
    totalUsers: number,
    playedUsers: number,
    totalAttempts: number,
    averageScore: number,
    perfectScores: number,
    completionRate: number,
    createdAt: string,
    updatedAt: string,
  } | null,
};
