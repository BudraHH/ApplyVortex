import { motion } from 'framer-motion';

export const Button = ({
    variant = 'primary',
    size = 'md',
    children,
    isLoading = false,
    disabled,
    className = '',
    ...props
}) => {
    const sizeClasses = {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg',
    };

    return (
        <motion.button
            className={`btn btn-${variant} ${sizeClasses[size]} ${className}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <span className="spinner" />
                    Loading...
                </>
            ) : (
                children
            )}
        </motion.button>
    );
};
