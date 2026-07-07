import { useParams } from 'react-router-dom'

const CreateApp = () => {

    let params = useParams()


    console.log(params.id);
    

  return (
    <div>
        <h1>
            {params.id}
        </h1>
    </div>
  )
}

export default CreateApp