import { Form, useLoaderData } from '@remix-run/react'
import React, { useState } from 'react'
import { authenticate } from '../shopify.server';
import { Button, TextField } from '@shopify/polaris';

export async function loader ({ request }){
    
const data = {
  title : "Tshort",
  description : "Description good"
}
    return Response.json(data)
}

export async function action ({ request }){

  let data = await request.formData();
  data = Object.entries(data)
  console.log(data);
  
      return Response.json(data)
  }



const pro = () => {
  const [productData, setProductData] = useState({
    title : "",
    description : ""
  })
    const response = useLoaderData(productData);
    console.log(response, "response");
    
  return (
    <div>
      <Form method='POST'>
        <TextField
        value={productData.title}
        onChange={(value)=> setProductData({...productData, title:value})}
        name='title'
         />
        <TextField
        value={productData.description}
        onChange={(value)=> setProductData({...productData, description:value})}
        name='description'
         />
        <Button submit>Add</Button>
      </Form>

    </div>
  )
}

export default pro