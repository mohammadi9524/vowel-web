import React, { useState } from 'react';
import { authenticate } from "../shopify.server";
import { useLoaderData, Form, useFetcher, data } from '@remix-run/react';
import { Card, DataTable, Button, Modal, TextField } from '@shopify/polaris';

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query {
        products(first: 10, reverse: true) {
          edges {
            node {
              id
              title
              handle
              description
              vendor
              variants(first:10) {
            edges {
              node {
                id
                price
                barcode
                createdAt
              }
            }
         }
              priceRange {
                minVariantPrice {
                  amount
                }
                maxVariantPrice {
                  amount
                }
              }
            }
          }
        }
      }`
  );

  const data = await response.json();
  return data;
}

export async function action({ request }) {
  let formData = await request.formData();
  const { admin } = await authenticate.admin(request);

  const actionType = formData.get('actionType'); 
  let response;
  let newProduct;  

  if (actionType === 'create') {
     response = await admin.graphql(
   `#graphql
   mutation ProductCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
         id
         title
         handle
         status
         variants(first:10) {
            edges {
              node {
                id
                price
                barcode
                createdAt
              }
            }
         }
         options {
           id
           name
           position
           optionValues {
             id
             name
           }
         }
       }
       userErrors {
         field
         message
       }
     }
   }`,
  {
    variables: {
      "input": {
        "title": formData.get("title"),
        "handle" : formData.get("handle"),
        "productOptions": [
          {
            "name": "Color",
            "values": [
              {
                "name": "Red"
              },
            ]
          },
          {
            "name": "Size",
            "values": [
              {
                "name": "Small"
              },
            ]
          }
        ],
      }
    },
  },
);

 const newProduct = await response.json();
 const product = newProduct.data.productCreate.product;
 const variantId = product.variants.edges[0].node.id;
 
 response = await admin.graphql(
  `#graphql
  mutation UpdateProductVariantsOptionValuesInBulk($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      product {
        id
      }
      productVariants {
        id
        price
      }
    }
  }`,
  {
    variables: {
      productId: product.id,
      variants: [
        {
          id: variantId,
          price: formData.get('price')
        }
      ]
    }
  }
);
    
  }

  if (actionType === 'edit') {
    const productId = formData.get('productId');
    // console.log(productId, "check");
    
    const title = formData.get('title');
    const handle = formData.get('handle')
    const price = formData.get('price');
    const variantId = formData.get('variantId')
    console.log(variantId, "vId");
    
     response = await admin.graphql(
      `#graphql
      mutation ProductUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            handle
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          "input": {
            "id": productId,
            "title": title,
            "handle": handle
          }
        },
      },
    );

    response = await admin.graphql(
      `#graphql
      mutation UpdateProductVariantsOptionValuesInBulk($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          product {
            id
          }
          productVariants {
            id
            price
          }
        }
      }`,
      {
        variables: {
          productId: productId,
          variants: [
            {
              id: variantId,
              price: price
            }
          ]
        }
      }
    );
  }

  if (actionType === 'delete') {
    const productId = formData.get('productId');
     response = await admin.graphql(
      `#graphql
      mutation {
        productDelete(input: {id: "${productId}"}) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }`,
    );
    
  }

  const data = await response.json();
  return data;
}

const Products = () => {
  const [productData, setProductData] = useState({
    title: '',
    handle: '',
    price: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const fetchProducts = useLoaderData();
  const fetcher = useFetcher();

  const handleDelete = (id) => {
    fetcher.submit(
      {
        actionType: 'delete',
        productId: id,
      },
      { method: 'POST' }
    );
  };

  const handleEdit = (product) => {
    handleModalOpen('edit', product);
    console.log(product);
    
  };

  const handleModalOpen = (actionType, product = null) => {
    setEditingProduct(product);
    if (actionType === 'edit' && product) {
      setProductData({
        title: product.title,
        handle: product.handle,
        price: product.variants.edges[0].node.price,
      });
    } else {
      setProductData({
        title: '',
        handle: '',
        price: '',
      });
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const rows = fetchProducts && fetchProducts.data && fetchProducts.data.products && fetchProducts.data.products.edges.map((product) => [
    product.node.title,
    product.node.handle,
    product.node.variants.edges[0].node.price,
    product.node.vendor,
    <Button onClick={() => handleEdit(product.node)}>Edit</Button>,
    <Button onClick={() => handleDelete(product.node.id)}>Delete</Button>,
  ]);

  const columns = [
    'Product Title',
    'Description',
    'Price',
    'Vendor',
    'Actions',
    'Delete',
  ];

  return (
    <Card title="Product Management" sectioned>
      <Button primary onClick={() => handleModalOpen('create')}>Add Product</Button>
      <DataTable
        columnContentTypes={['text', 'text', 'text', 'text', 'node', 'node']}
        headings={columns}
        rows={rows}
      />
      <Modal
        open={showModal}
        onClose={handleModalClose}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleModalClose,
          },
        ]}
      >
        <Modal.Section>
          <Form method='POST'>
            <input type="hidden" name="actionType" value={editingProduct ? 'edit' : 'create'} />
            {editingProduct && <input type="hidden" name="productId" value={editingProduct.id} />}
            {editingProduct && <input type="hidden" name="variantId" value={editingProduct.variants.edges[0].node.id} />}
            <TextField
              label="Product Title"
              name='title'
              value={productData.title}
              onChange={(value) => setProductData({ ...productData, title: value })}
            />
            <TextField
              label="Description"
              name='handle'
              value={productData.handle}
              onChange={(value) => setProductData({ ...productData, handle: value })}
              multiline
            />
            <TextField
              label="Price"
              name='price'
              value={productData.price}
              onChange={(value) => setProductData({ ...productData, price: value })}
              type="text"
            />
            <Button submit>{editingProduct ? 'Save Changes' : 'Add Product'}</Button>
          </Form>
        </Modal.Section>
      </Modal>
    </Card>
  );
};

export default Products;
