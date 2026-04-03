import { Utensils } from "lucide-react";

const TabbledLogo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-9 h-9 rounded-[9px] bg-gradient-to-br from-sage to-sage-light flex items-center justify-center">
      <Utensils className="w-5 h-5 text-sage-foreground" />
    </div>
    <span className="font-heading font-extrabold text-xl lowercase text-foreground">tabbled</span>
  </div>
);

export default TabbledLogo;
