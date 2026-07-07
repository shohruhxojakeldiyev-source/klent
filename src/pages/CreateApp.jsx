import { useParams } from 'react-router-dom'

const CreateApp = () => {

    let id = useParams()


    console.log(id);
    

  return (
    <div>
        <h1>
            {id}
        </h1>
    </div>
  )
}

export default CreateApp