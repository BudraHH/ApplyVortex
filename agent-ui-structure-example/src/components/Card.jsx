import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hoverable = true, glass = false }) => {
    return (
        <motion.div
            className={`card ${glass ? 'glass' : ''} ${hoverable ? 'card-hoverable' : ''} ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={hoverable ? { y: -4 } : {}}
        >
            {children}
        </motion.div>
    );
};
