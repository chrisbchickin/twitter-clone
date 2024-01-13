import Link from "next/link";
import { ProfileImage } from "./ProfileImage";
import { api } from "~/utils/api";
import { DropDownMenu } from "./DropDownMenu";
import { HeartButton } from "./HeartButton";
import { useSession } from "next-auth/react";

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
    const session = useSession();
    const trpcUtils = api.useContext();
    const toggleLike = api.tweet.toggleLike.useMutation({
      onSuccess: ({ addedLike }) => {
        const updateData: Parameters<
          typeof trpcUtils.tweet.infiniteFeed.setInfiniteData
        >[1] = oldData => {
          if (oldData == null) return;
  
          const countModifier = addedLike ? 1 : -1;
  
          return {
            ...oldData,
            pages: oldData.pages.map(page => {
              return {
                ...page,
                tweets: page.tweets.map(tweet => {
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
  
    return (
      <li className="flex gap-4 border-b px-4 py-4">
        <Link href={`/profiles/${user.id}`}>
          <ProfileImage src={user.image} />
        </Link>
        <div className="flex flex-grow flex-col">
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
              {session.status === "authenticated" && session.data.user.id === user.id && <DropDownMenu tweetId={id} />}
            </div>
          </div>
          <p className="whitespace-pre-wrap">{content}</p>
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
  
