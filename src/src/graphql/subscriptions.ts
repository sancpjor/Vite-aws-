/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateLeaderboardEntry = /* GraphQL */ `subscription OnCreateLeaderboardEntry(
  $filter: ModelSubscriptionLeaderboardEntryFilterInput
) {
  onCreateLeaderboardEntry(filter: $filter) {
    id
    alias
    email
    score
    totalQuestions
    percentage
    date
    time
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateLeaderboardEntrySubscriptionVariables,
  APITypes.OnCreateLeaderboardEntrySubscription
>;
export const onUpdateLeaderboardEntry = /* GraphQL */ `subscription OnUpdateLeaderboardEntry(
  $filter: ModelSubscriptionLeaderboardEntryFilterInput
) {
  onUpdateLeaderboardEntry(filter: $filter) {
    id
    alias
    email
    score
    totalQuestions
    percentage
    date
    time
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateLeaderboardEntrySubscriptionVariables,
  APITypes.OnUpdateLeaderboardEntrySubscription
>;
export const onDeleteLeaderboardEntry = /* GraphQL */ `subscription OnDeleteLeaderboardEntry(
  $filter: ModelSubscriptionLeaderboardEntryFilterInput
) {
  onDeleteLeaderboardEntry(filter: $filter) {
    id
    alias
    email
    score
    totalQuestions
    percentage
    date
    time
    timestamp
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteLeaderboardEntrySubscriptionVariables,
  APITypes.OnDeleteLeaderboardEntrySubscription
>;
export const onCreateQuizStats = /* GraphQL */ `subscription OnCreateQuizStats($filter: ModelSubscriptionQuizStatsFilterInput) {
  onCreateQuizStats(filter: $filter) {
    id
    totalUsers
    playedUsers
    totalAttempts
    averageScore
    perfectScores
    completionRate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateQuizStatsSubscriptionVariables,
  APITypes.OnCreateQuizStatsSubscription
>;
export const onUpdateQuizStats = /* GraphQL */ `subscription OnUpdateQuizStats($filter: ModelSubscriptionQuizStatsFilterInput) {
  onUpdateQuizStats(filter: $filter) {
    id
    totalUsers
    playedUsers
    totalAttempts
    averageScore
    perfectScores
    completionRate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateQuizStatsSubscriptionVariables,
  APITypes.OnUpdateQuizStatsSubscription
>;
export const onDeleteQuizStats = /* GraphQL */ `subscription OnDeleteQuizStats($filter: ModelSubscriptionQuizStatsFilterInput) {
  onDeleteQuizStats(filter: $filter) {
    id
    totalUsers
    playedUsers
    totalAttempts
    averageScore
    perfectScores
    completionRate
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteQuizStatsSubscriptionVariables,
  APITypes.OnDeleteQuizStatsSubscription
>;
