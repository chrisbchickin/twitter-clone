import { Dispatch, FormEvent, useEffect, useRef } from "react";
import { Button } from "./Button";
import { ActionsType, ACTIONS, ReducerState } from "./TweetCard";
import { api } from "~/utils/api";

type EditTweetFormProps = {
    dispatch: Dispatch<ActionsType>
    state: ReducerState
    id: string
    content: string
    user: {
      id: string;
      image: string | null;
      name: string | null;
  }
}


export function EditTweetForm({ dispatch, state, id, user, content }: EditTweetFormProps) {
  const trpcUtils = api.useContext();
  const editTweet = api.tweet.editTweet.useMutation({
    onSuccess: (newContent) => {
      const updateData: Parameters<
        typeof trpcUtils.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((tweet) => {
                if (tweet.id === id) {
                  return {
                    ...tweet,
                    content: newContent,
                  };
                }
                return tweet;
              }),
            };
          }),
        };
      };

      trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
      trpcUtils.tweet.infinteProfileFeed.setInfiniteData(
        { userId: user.id },
        updateData,
      );
    },
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (state.isFormOpen && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(state.formValue.length, state.formValue.length);
    }
  }, [state.isFormOpen, textareaRef]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
   dispatch({ type: ACTIONS.CLOSE_FORM })
   editTweet.mutate({ content: state.formValue, id });
  }

    return <form
    onSubmit={handleSubmit}
    className="flex h-1/3 justify-between gap-1 border-b"
  >
    <div className="flex w-5/6">
      <textarea
        ref={textareaRef}
        value={state.formValue}
        maxLength={190}
        onChange={(e) => dispatch({ type: ACTIONS.SET_FORM_VALUE, payload: e.target.value })}
        className="flex-grow resize-none overflow-hidden pt-1 text-lg outline-none"
      />
    </div>
    <div className="flex gap-3">
      <Button
        onClick={(e) => {
          e.preventDefault();
          dispatch({ type: ACTIONS.SET_FORM_VALUE, payload: content })
          dispatch({ type: ACTIONS.CLOSE_FORM })
        }}
        className="mb-1 px-4 py-0"
        small
        gray
      >
        Cancel
      </Button>
      <Button type="submit" className="mb-1 px-4 py-0" small>
        Save
      </Button>
    </div>
  </form>
}