import * as React from "react";

type IconNode = Array<[string, Record<string, unknown>]>;

type IconProps = React.SVGProps<SVGSVGElement> & {
  iconNode: IconNode;
  color?: string;
  size?: string | number;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
};

const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  (
    {
      iconNode,
      color = "currentColor",
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      className,
      ...props
    },
    ref,
  ) => {
    const resolvedSize = typeof size === "string" ? Number(size) || 24 : size;
    const resolvedStrokeWidth =
      absoluteStrokeWidth && resolvedSize ? (Number(strokeWidth) * 24) / resolvedSize : strokeWidth;

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={resolvedSize}
        height={resolvedSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={resolvedStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        {iconNode.map(([tag, attrs]) =>
          React.createElement(tag, { ...attrs, key: (attrs as { key?: string }).key }),
        )}
      </svg>
    );
  },
);

Icon.displayName = "LucideIcon";

export default Icon;
