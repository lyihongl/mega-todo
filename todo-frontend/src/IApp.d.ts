import { ApolloError, OperationVariables } from "@apollo/client";

export interface IUserState {
  userId: string;
  setUserId: (s: string) => void;
}

export interface ISub<T> {
  variables: OperationVariables | undefined;
  loading: boolean;
  error?: ApolloError | undefined;
  data?: T | undefined;
}
