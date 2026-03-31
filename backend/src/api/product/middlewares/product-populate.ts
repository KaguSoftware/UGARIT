const populate = {
	image: {
		populate: true,
	},
	category: {
		populate: true,
	},
};

export default (config, { strapi }) => {
	return async (ctx, next) => {
		// This injects the populate rules into every request
		ctx.query = {
			...ctx.query,
			populate: populate,
		};
		await next();
	};
};
