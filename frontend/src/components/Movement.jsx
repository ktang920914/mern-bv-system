import { TextInput, Button} from "flowbite-react";
import { useState } from "react";

const Movement = () => {

  const [searchTerm,setSearchTerm] = useState('')

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.trim())
  }

  return (
    <div>
       <div className='flex justify-between items-center mb-4'>
            <h1 className='text-2xl font-semibold'>Movements</h1>
            <div>
                <TextInput placeholder='Enter searching'/>
            </div>
            <Button className='cursor-pointer'>Create movement</Button>
        </div>
    </div>
  )
}

export default Movement