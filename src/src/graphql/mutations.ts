/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createLeaderboardEntry = /* GraphQL */ `mutation CreateLeaderboardEntry(
  $input: CreateLeaderboardEntryInput!
  $condition: ModelLeaderboardEntryConditionInput
) {
  createLeaderboardEntry(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateLeaderboardEntryMutationVariables,
  APITypes.CreateLeaderboardEntryMutation
>;
export const updateLeaderboardEntry = /* GraphQL */ `mutation UpdateLeaderboardEntry(
  $input: UpdateLeaderboardEntryInput!
  $condition: ModelLeaderboardEntryConditionInput
) {
  updateLeaderboardEntry(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateLeaderboardEntryMutationVariables,
  APITypes.UpdateLeaderboardEntryMutation
>;
export const deleteLeaderboardEntry = /* GraphQL */ `mutation DeleteLeaderboardEntry(
  $input: DeleteLeaderboardEntryInput!
  $condition: ModelLeaderboardEntryConditionInput
) {
  deleteLeaderboardEntry(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteLeaderboardEntryMutationVariables,
  APITypes.DeleteLeaderboardEntryMutation
>;
export const createQuizStats = /* GraphQL */ `mutation CreateQuizStats(
  $input: CreateQuizStatsInput!
  $condition: ModelQuizStatsConditionInput
) {
  createQuizStats(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateQuizStatsMutationVariables,
  APITypes.CreateQuizStatsMutation
>;
export const updateQuizStats = /* GraphQL */ `mutation UpdateQuizStats(
  $input: UpdateQuizStatsInput!
  $condition: ModelQuizStatsConditionInput
) {
  updateQuizStats(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateQuizStatsMutationVariables,
  APITypes.UpdateQuizStatsMutation
>;
export const deleteQuizStats = /* GraphQL */ `mutation DeleteQuizStats(
  $input: DeleteQuizStatsInput!
  $condition: ModelQuizStatsConditionInput
) {
  deleteQuizStats(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteQuizStatsMutationVariables,
  APITypes.DeleteQuizStatsMutation
>;
