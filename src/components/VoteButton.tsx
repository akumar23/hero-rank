import React from "react";

export interface VoteButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Shared vote button component for use on both front and back of cards.
 * Ensures consistent styling, accessibility, and behavior across flip states.
 */
export const VoteButton: React.FC<VoteButtonProps> = ({ onClick, disabled }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // Prevent flip trigger
    e.preventDefault(); // Prevent any default behavior
    if (!disabled) {
      onClick();
    }
  };

  return (
    <button
      data-vote-button
      onClick={handleClick}
      disabled={disabled}
      className="btn-brutal-signal w-full text-center text-sm text-paper font-display font-bold uppercase tracking-wide group-hover:shadow-brutal-lg group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 min-h-[44px] flex items-center justify-center"
      type="button"
      aria-label="Vote for this hero"
      style={{ color: '#0D0D0D' }} // Explicit text color (paper color)
    >
      VOTE
    </button>
  );
};

