/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getLeaderboardEntry = /* GraphQL */ `query GetLeaderboardEntry($id: ID!) {
  getLeaderboardEntry(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetLeaderboardEntryQueryVariables,
  APITypes.GetLeaderboardEntryQuery
>;
export const listLeaderboardEntries = /* GraphQL */ `query ListLeaderboardEntries(
  $filter: ModelLeaderboardEntryFilterInput
  $limit: Int
  $nextToken: String
) {
  listLeaderboardEntries(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListLeaderboardEntriesQueryVariables,
  APITypes.ListLeaderboardEntriesQuery
>;
export const getQuizStats = /* GraphQL */ `query GetQuizStats($id: ID!) {
  getQuizStats(id: $id) {
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
` as GeneratedQuery<
  APITypes.GetQuizStatsQueryVariables,
  APITypes.GetQuizStatsQuery
>;
export const listQuizStats = /* GraphQL */ `query ListQuizStats(
  $filter: ModelQuizStatsFilterInput
  $limit: Int
  $nextToken: String
) {
  listQuizStats(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
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
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListQuizStatsQueryVariables,
  APITypes.ListQuizStatsQuery
>;
