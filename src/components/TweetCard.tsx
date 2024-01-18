import Link from "next/link";
import { ProfileImage } from "./ProfileImage";
import { api } from "~/utils/api";
import { DropDownMenu } from "./DropDownMenu";
import { HeartButton } from "./HeartButton";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";
import { Button } from "./Button";

type Tweet = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
  user: { id: string; image: string | null; name: string | null };
};

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

export function TweetCard({
  id,
  user,
  content,
  createdAt,
  likeCount,
  likedByMe,
}: Tweet) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formValue, setFormValue] = useState(content);

  const session = useSession();
  const trpcUtils = api.useContext();
  const toggleLike = api.tweet.toggleLike.useMutation({
    onSuccess: ({ addedLike }) => {
      const updateData: Parameters<
        typeof trpcUtils.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;

        const countModifier = addedLike ? 1 : -1;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((tweet) => {
                if (tweet.id === id) {
                  return {
                    ...tweet,
                    likeCount: tweet.likeCount + countModifier,
                    likedByMe: addedLike,
                  };
                }
                return tweet;
              }),
            };
          }),
        };
      };

      trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
      trpcUtils.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updateData,
      );
      trpcUtils.tweet.infinteProfileFeed.setInfiniteData(
        { userId: user.id },
        updateData,
      );
    },
  });

  function handleToggleLike() {
    toggleLike.mutate({ id });
  }

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
  })

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsFormOpen(false);
    editTweet.mutate({ content: formValue, id, });
  }

  return (
    <li className="flex gap-4 border-b px-4 py-4">
      <Link href={`/profiles/${user.id}`}>
        <ProfileImage src={user.image} />
      </Link>
      <div className="flex flex-grow flex-col justify-around">
        <div className="relative flex gap-1">
          <Link
            href={`/profiles/${user.id}`}
            className="font-bold hover:underline focus-visible:underline"
          >
            {user.name}
          </Link>
          <span className="text-gray-500">-</span>
          <span className="text-gray-500">
            {dateTimeFormatter.format(createdAt)}
          </span>
          <div className="absolute right-0 top-0 self-center">
            {session.status === "authenticated" &&
              session.data.user.id === user.id &&
              !isFormOpen && (
                <DropDownMenu tweetId={id} setIsFormOpen={setIsFormOpen} />
              )}
          </div>
        </div>
        {isFormOpen ? (
          <form
            onSubmit={handleSubmit}
            className="flex h-1/3 justify-between gap-1 border-b"
          >
            <div className="flex w-5/6">
              <textarea
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                className="flex-grow resize-none overflow-hidden pt-1 text-lg outline-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  setFormValue(content);
                  setIsFormOpen(false);
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
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
        <HeartButton
          onClick={handleToggleLike}
          isLoading={toggleLike.isLoading}
          likedByMe={likedByMe}
          likeCount={likeCount}
        />
      </div>
    </li>
  );
}
