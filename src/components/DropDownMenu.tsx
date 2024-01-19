import { MdDelete, MdEdit } from "react-icons/md";
import { useState, useRef, useEffect, SetStateAction, ReactNode, DetailedHTMLProps, TextareaHTMLAttributes } from "react";
import { IoIosMore } from "react-icons/io";
import { api } from "~/utils/api";
import { IconHoverEffect } from "./IconHoverEffect";

type DropDownMenuProps = {
  tweetId: string;
  setIsFormOpen: React.Dispatch<SetStateAction<boolean>>;
};

type DropDownItemProps = {
  icon?: React.ReactNode;
  handleClick: () => void;
  children: ReactNode;
};

export function DropDownMenu({ tweetId, setIsFormOpen, }: DropDownMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function isNode(target: EventTarget | null): target is Node {
    return target !== null && typeof target === 'object' && 'nodeType' in target;
  }

  const dropdownRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isNode(event.target)) {
        setIsMenuOpen(false);
      } else if (!dropdownRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);


  return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

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

  function handleEdit() {
    setIsFormOpen(true);
  }

  return (
    <div className="relative">
      {!isMenuOpen && <IconHoverEffect>
      <button
        className="w-15 relative cursor-default px-2 py-2 text-left hover:cursor-pointer focus:outline-none focus-visible:border-orange-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
        <IoIosMore style={{ fontSize: "24px" }} />
      </button>
      </IconHoverEffect>}
      {isMenuOpen && (
        <ul ref={dropdownRef} className="absolute top-0 right-0 mt-1 max-h-60 overflow-auto rounded-md bg-white py-1 pl-1.5 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          <DropDownItem handleClick={handleEdit} icon={<MdEdit />}>Edit</DropDownItem>
          <DropDownItem handleClick={handleDelete} icon={<MdDelete />}>Delete</DropDownItem>
        </ul>
      )}
    </div>
  );
}

function DropDownItem({ children, icon, handleClick }: DropDownItemProps) {
  return (
    <li className="relative cursor-default select-none px-4 py-3 pr-6">
      {icon && (
        <button
          onClick={handleClick}
          className="flex items-center justify-between gap-1"
        >
          {icon}
          {children}
        </button>
      )}
    </li>
  );
}
