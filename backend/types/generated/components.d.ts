import type { Schema, Struct } from '@strapi/strapi';

export interface BlocksCard extends Struct.ComponentSchema {
  collectionName: 'components_blocks_cards';
  info: {
    displayName: 'card';
  };
  attributes: {
    currentPrice: Schema.Attribute.Decimal & Schema.Attribute.Required;
    favorite: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    image: Schema.Attribute.Media<'images' | 'files'> &
      Schema.Attribute.Required;
    priceBeforeDiscount: Schema.Attribute.Decimal;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'blocks.card': BlocksCard;
    }
  }
}
