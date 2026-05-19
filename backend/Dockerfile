FROM python:3.11-slim

# Set the working directory
WORKDIR /code

# Install system dependencies required for python packages like reportlab
RUN apt-get update && apt-get install -y gcc g++ libffi-dev libjpeg-dev zlib1g-dev && rm -rf /var/lib/apt/lists/*


# Copy the requirements file into the container
COPY ./requirements.txt /code/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the backend code
COPY ./app /code/app

# Run the FastAPI server with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
