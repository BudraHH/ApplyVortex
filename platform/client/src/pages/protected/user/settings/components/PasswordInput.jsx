import { KeyRound, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";

export const PasswordInput = ({ id, show, setShow, ...props }) => (
    <div className="relative">
       <Input
            id={id}
            type={show ? "text" : "password"}
            className="pr-5"
            {...props}
        />
        <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
    </div>
);
