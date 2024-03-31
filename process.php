<?php
if(isset($_POST['evidence-description'])){

    $persistInfo = true;

    $uploadDir = 'uploads/'; // Directory for uploading images
    $fileName = "-0";

    // Check if image file is a actual image or fake image
    $check = getimagesize($_FILES['image']['tmp_name']);
    if($check !== false) {
        $uploadedFile = $uploadDir . basename($_FILES['image']['name']); // Path to store the uploaded file
        // Check if file already exists
        if (file_exists($uploadedFile)) {
            echo "<p>ya existe un archivo con el mismo nombre</p>";
            $persistInfo = false;
        } else {
            // Check file size
            if ($_FILES['image']['size'] > 5000000) {
                echo "<p>El archivo supera los 4mb de espacio</p>";
                $persistInfo = false;
            } else {
                // Allow only certain file formats
                $allowedTypes = array('jpg', 'jpeg', 'png', 'gif');
                $fileExtension = strtolower(pathinfo($uploadedFile,PATHINFO_EXTENSION));
                if (!in_array($fileExtension, $allowedTypes)) {
                    echo "<p>Solo archivos JPG, JPEG, PNG & GIF estan permitidos.<p>";
                    $persistInfo = false;
                } else {
                    // Upload file
                    if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadedFile)) {
                        $fileName = basename( $_FILES['image']['name']);
                        echo "<p>Se registró correctamente la evidencia</p>";

                        // Verificar si el archivo existe
                        if (!file_exists('evidences/'.$_POST["evidence-idPlace"].'.json')) {
                             $contenido = "[]";
                            if (file_put_contents('evidences/'.$_POST["evidence-idPlace"].'.json', $contenido) !== false) {
                            } else {
                                echo "Error al crear el archivo.\n";
                                $persistInfo = false;
                            }
                        } 
                       
                       
                    } else {
                        echo "<p>Sorry, there was an error uploading your file.</p>";
                        $persistInfo = false;
                    }
                }
            }
        }
    } else {

        try {
            //check if its a binary file
            $base64_string = $_POST['image'];
            $imagen_base64 = $base64_string;
            $imagen_base64 = str_replace('data:image/png;base64,', '', $imagen_base64);
            $imagen_base64 = str_replace('data:image/jpeg;base64,', '', $imagen_base64);
            $imagen_base64 = str_replace('data:image/jpg;base64,', '', $imagen_base64);
            $imagen_base64 = str_replace(' ', '+', $imagen_base64);
            $image_data = base64_decode($imagen_base64);


            echo $base64_string;
            $fileName = strtotime('now')."-sync.jpg";
            $uploadedFile = $uploadDir.$fileName;
            // Guardar la imagen en el servidor (por ejemplo, en una carpeta llamada 'uploads')
            file_put_contents($uploadedFile , $image_data);
            echo "creo la imagen satisfactoriamente";
        } catch (Exception $e) {
            // Código para manejar la excepción
            echo "Se produjo un error: " . $e->getMessage(); // Muestra el mensaje de la excepción
            $persistInfo = false;
        }

    }

    if($persistInfo){

        if(file_exists('evidences/'.$_POST["evidence-idPlace"].'.json')){
            $jsonData = file_get_contents('evidences/'.$_POST["evidence-idPlace"].'.json');
            // Decode JSON data into PHP associative array
            $bigArray = json_decode($jsonData, true);
        }else{
            $bigArray = array();
        }
        

        $data = array(
            "image" => $fileName,
            "latitude" => $_POST["latitude"],
            "longitude" => $_POST["longitude"],
            "date" => date('Y-m-d H:i:s'),
            "description" => $_POST["evidence-description"]
        );

        array_push($bigArray, $data);
        
        // Convert PHP array to JSON string
        $jsonString = json_encode($bigArray);
        
        // Specify the file path
        $filePath = 'evidences/'.$_POST["evidence-idPlace"].'.json';
        
        // Write JSON string to file
        if (file_put_contents($filePath, $jsonString)) {
            echo "<p>Redireccionando a home automáticamente.....</p>";
            if(!isset($POST["redirect"])){
                header("Location: index.html?detail-view=".$_POST["evidence-idPlace"]);
            }
            exit();
        } else {
            echo "<p>No se puso persisitr la información, intente de nuevo</p>";
        }
    }

    
    echo "<p><a href='index.html'>Volver al formulario<a></p>";


}else{
    echo "{ error: 'Not contain innfo'}";
}

if(!$persistInfo){
    http_response_code(500);
}
?>