import { GetInitialState, State } from 'wolkenkit';

export interface MessageState extends State {
  text: string;
  likes: number;
}

export const getInitialState: GetInitialState<MessageState> = function (): MessageState {
  return {
    text: '',
    likes: 0
  };
};
