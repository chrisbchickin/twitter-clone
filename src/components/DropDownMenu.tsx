import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { useState } from "react";
import { IoIosMore } from "react-icons/io";
import { api } from "~/utils/api";

type DropDownMenuProps = {
  tweetId: string;
};

type DropDownItemProps = {
  icon?: React.ReactNode;
  handleClick: () => void;
};

export function DropDownMenu({ tweetId }: DropDownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const trpcUtils = api.useContext();
  const deleteTweet = api.tweet.delete.useMutation({
    onSuccess: () => {
      const updateData: Parameters<
        typeof trpcUtils.tweet.infiniteFeed.setInfiniteData
      >[1] = oldData => {
        if (oldData == null) return;

        return {
          ...oldData,
          pages: oldData.pages.map(page => {
            return {
              ...page,
              tweets: page.tweets.filter(tweet => tweet.id !== tweetId),
            };
          }),
        };
      };

      trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
    },
  });

  function handleDelete() {
    deleteTweet.mutate({ id: tweetId });
  }

  return (
    <div className="relative">
      <button
        className="w-15 relative cursor-default px-2 py-2 text-left focus:outline-none focus-visible:border-orange-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <IoIosMore style={{ fontSize: "24px" }} />
      </button>
      {isOpen && (
        <ul className=" absolute mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          <DropDownItem handleClick={handleDelete} icon={<MdDelete />} />
          <DropDownItem handleClick={handleDelete} icon={<MdEdit />} />
        </ul>
      )}
    </div>
  );
}

function DropDownItem({ icon, handleClick }: DropDownItemProps) {
  return (
    <li className="relative cursor-default select-none px-4 py-3 pr-6">
      {icon && (
        <button
          onClick={handleClick}
          className="flex items-center justify-between"
        >
          {icon}
        </button>
      )}
    </li>
  );
}
