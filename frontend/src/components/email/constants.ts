import { Variants } from "motion/react";

export const FORM_RESET_TIMEOUT = 5000;

export const fadeUpVariant: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.8 },
	},
};

export const alertVariant: Variants = {
	initial: { opacity: 0, y: 10 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -10 },
};
