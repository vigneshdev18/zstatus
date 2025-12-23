import { cn } from "@/lib/utils/cn";

const DetailCard = ({
  title,
  value,
  icon,
  iconContainerClass,
}: {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  iconContainerClass?: string;
}) => {
  return (
    <div className="glass rounded-2xl p-6 transition-smooth hover:shadow-gradient">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        {icon && (
          <div
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center",
              iconContainerClass
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailCard;
