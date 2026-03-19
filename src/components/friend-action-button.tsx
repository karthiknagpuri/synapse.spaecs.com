"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  UserMinus,
  Check,
  Clock,
  Loader2,
} from "lucide-react";

interface FriendActionButtonProps {
  targetUserId: string;
  isFriend: boolean;
  friendshipId: string | null;
  pendingDirection: "sent" | "received" | null;
  pendingRequestId: string | null;
}

export function FriendActionButton({
  targetUserId,
  isFriend: initialIsFriend,
  friendshipId: initialFriendshipId,
  pendingDirection: initialPending,
  pendingRequestId,
}: FriendActionButtonProps) {
  const router = useRouter();
  const [isFriend, setIsFriend] = useState(initialIsFriend);
  const [pending, setPending] = useState(initialPending);
  const [loading, setLoading] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleAddFriend = async () => {
    setLoading(true);
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_user_id: targetUserId }),
      });
      setPending("sent");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!pendingRequestId) return;
    setLoading(true);
    try {
      await fetch(`/api/friends/${pendingRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      setIsFriend(true);
      setPending(null);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!initialFriendshipId) return;
    setLoading(true);
    try {
      await fetch(`/api/friends/${initialFriendshipId}`, {
        method: "DELETE",
      });
      setIsFriend(false);
      setConfirmRemove(false);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-sm font-medium text-gray-400"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading...
      </button>
    );
  }

  // Already friends
  if (isFriend) {
    if (confirmRemove) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handleRemove}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            <UserMinus className="h-3.5 w-3.5" />
            Confirm Remove
          </button>
          <button
            onClick={() => setConfirmRemove(false)}
            className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-sm font-medium text-gray-600">
          <Check className="h-3.5 w-3.5 text-green-600" />
          Friends
        </span>
        <button
          onClick={() => setConfirmRemove(true)}
          className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
          title="Remove friend"
        >
          <UserMinus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Pending request sent by you
  if (pending === "sent") {
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-sm font-medium text-gray-500">
        <Clock className="h-3.5 w-3.5" />
        Request Sent
      </span>
    );
  }

  // Pending request received from them
  if (pending === "received") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleAccept}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
          Accept Request
        </button>
        <span className="text-xs text-gray-400">
          Wants to connect with you
        </span>
      </div>
    );
  }

  // No relationship — show add button
  return (
    <button
      onClick={handleAddFriend}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
    >
      <UserPlus className="h-3.5 w-3.5" />
      Add Friend
    </button>
  );
}
