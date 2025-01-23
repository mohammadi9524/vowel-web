import React, { useState } from 'react';
import { authenticate } from "../shopify.server";
import { useLoaderData, Form, useFetcher, data } from '@remix-run/react';
import { Card, DataTable, Button, Modal, TextField } from '@shopify/polaris';

export async function loader ({ request }){
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
}`,
);

const data = await response.json();

  return data
 
}

export async function action({ request }) {

  let formData = await request.formData();
  
  const { admin } = await authenticate.admin(request);

const response = await admin.graphql(
  `#graphql
  mutation ProductCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
        options {
          id
          name
          position
          optionValues {
            id
            name
            hasVariants
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
        "handle" : formData.get("description"),
        "productOptions": [
          {
            "name": "Color",
            "values": [
              {
                "name": "Red"
              },
              {
                "name": "Blue"
              }
            ]
          },
          {
            "name": "Size",
            "values": [
              {
                "name": "Small"
              },
              {
                "name": "Large"
              }
            ]
          }
        ]
      }
    },
  },
);

const data = await response.json();

return data

}


const Products = () => {
    const [productData, setProductData] = useState({
        title: '',
        description: '',
        body_html: '',
        price: '',
      });
      // console.log(productData);
      
      // const [products, setProducts] = useState([]);
      // const [loading, setLoading] = useState(true);
      const [showModal, setShowModal] = useState(false);
      const [editingProduct, setEditingProduct] = useState(null);
    const fetchProducts = useLoaderData(productData);
    // console.log(fetchProducts, "fetch");

    const handleDelete = (id)=>{
      
    }

   
    
    const rows = fetchProducts && fetchProducts.data && fetchProducts.data.products && fetchProducts.data.products.edges.map((product) => [
        product.node.title,
        product.node.handle,
        product && product.node.priceRange && product.node.priceRange.maxVariantPrice && product.node.priceRange.maxVariantPrice.amount,
        product.node.vendor,
        <Button onClick={() => handleModalOpen(product)}>Edit</Button>,
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

      const handleModalOpen = (product = null) => {
        setEditingProduct(product);
        if (product) {
          setProductData({
            title: product.title,
            body_html: product.body_html,
            description: product.description,
            vendor: product.vendor,
            price: product.variants[0]?.price,
          });
        } else {
          setProductData({
            title: '',
            body_html: '',
            description: '',
            vendor: '',
            price: '',
            // image_src: '',
          });
        }
        setShowModal(true);
      };
    
      const handleModalClose = () => {
        setShowModal(false);
      };

      // const handleSubmit = ()=> fetcher.submit({}, {method: "POST"})

  return (
    <Card title="Product Management" sectioned>
    <Button primary onClick={() => handleModalOpen()}>Add Product</Button>
    <DataTable
      columnContentTypes={['text', 'text', 'text', 'text', 'text', 'node', 'node']}
      headings={columns}
      rows={rows}
    />
    <Modal
      open={showModal}
      onClose={handleModalClose}
      title={editingProduct ? 'Edit Product' : 'Add New Product'}
      // primaryAction={{
      //   content: editingProduct ? 'Save Changes' : 'Add Product',
      //   onAction: submit,
      // }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: handleModalClose,
        },
      ]}
    >
      <Modal.Section>
        <Form method='POST'>
          <TextField
            label="Product Title"
            name='title'
            value={productData.title}
            onChange={(value) => setProductData({ ...productData, title: value })}
            autoComplete="off"
          />
          <TextField
            label="Description"
            name='description'
            value={productData.description}
            onChange={(value) => setProductData({ ...productData, description: value })}
            multiline
            autoComplete="off"
          />
          <TextField
            label="Price"
            name='price'
            value={productData.price}
            onChange={(value) => setProductData({ ...productData, price: value })}
            type="number"
            autoComplete="off"
          />
          <Button submit>Add Product</Button>
        </Form>
      </Modal.Section>
    </Modal>
  </Card>
  )
}

export default Products