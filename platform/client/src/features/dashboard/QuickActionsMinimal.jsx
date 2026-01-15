// src/features/dashboard/QuickActionsMinimal.jsx
import { Upload, Plus, Settings, CheckCircle2 } from 'lucide-react';

export function QuickActionsMinimal({ incompleteData, onAction }) {
    const actions = [];

    // Check what's missing
    if (!incompleteData.resume) {
        actions.push({
            // icon: Upload,
            title: 'Upload Resume',
            description: 'Required for job applications',
            action: 'upload-resume',
        });
    }

    if (!incompleteData.skills) {
        actions.push({
            // icon: Plus,
            title: 'Add Skills',
            description: 'Improve job matching accuracy',
            action: 'add-skills',
        });
    }

    if (!incompleteData.experience) {
        actions.push({
            // icon: Folder,
            title: 'Add Experience',
            description: 'Showcase your work history',
            action: 'add-experience',
        });
    }

    if (!incompleteData.github) {
        actions.push({
            // icon: LinkIcon,
            title: 'Connect GitHub',
            description: 'Show your projects and contributions',
            action: 'connect-github',
        });
    }

    if (!incompleteData.naukri) {
        actions.push({
            // icon: LinkIcon,
            title: 'Connect Naukri Profile',
            description: 'Integrate your Naukri data',
            action: 'connect-naukri',
        });
    }

    if (!incompleteData.linkedin) {
        actions.push({
            // icon: LinkIcon,
            title: 'Connect LinkedIn Profile',
            description: 'Enhance professional visibility',
            action: 'connect-linkedin',
        });
    }

    if (!incompleteData.portfolio) {
        actions.push({
            // icon: LinkIcon,
            title: 'Add Portfolio',
            description: 'Showcase your best work',
            action: 'add-portfolio', }); } if (actions.length === 0) { return ( <div className="bg-card border rounded-xl text-center"> <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" /> <h3 className="text-lg font-semibold mb-1">All Set!</h3> <p className="text-sm text-muted-foreground"> Your profile is complete. Ready to apply for jobs. </p> </div> ); } return ( <div className="bg-card border rounded-xl p-6"> <h2 className="text-lg font-semibold mb-4">Quick Actions</h2> <div className="space-y-3"> {actions.map((action, index) => ( <button key={index} onClick={() => onAction(action.action)} className="w-full flex items-start rounded-lg border-2 hover:bg-muted transition-colors text-left" > <div className="p-3 rounded-lg bg-foreground/5"> {/*<action.icon className="h-6 w-6" />*/} </div> <div className="flex-1"> <h3 className="font-semibold mb-1">{action.title}</h3> <p className="text-sm text-muted-foreground">{action.description}</p> </div> </button> ))} </div> </div> ); } p-2 md:p-3 lg:p-4 gap-2 md:gap-3 lg:gap-4