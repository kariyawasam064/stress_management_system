from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai

GOOGLE_API_KEY = "AIzaSyDxZ-PbxTx0W1YoDhiFRzJ5rjmCdiVNfvs"
genai.configure(api_key=GOOGLE_API_KEY)

class social_recommender:
    def __init__(self, model_name="gemini-flash-lite-latest"):
        self.__model = ChatGoogleGenerativeAI(
            model=model_name,  # <-- safe model
            temperature=0.7,
            google_api_key=GOOGLE_API_KEY
        )

        self.__output_parser = StrOutputParser()
        self.__template = (
            "I am currently experiencing {stress_level} social stress. Can you provide practical steps, exercises, or strategies to manage and reduce social stress in daily life, including ways to stay calm, communicate better, and handle social situations more confidently. give me 3 steps for this within less than 500 words"
        )
        self.__prompt_template = PromptTemplate(
            template=self.__template,
            input_variables=["stress_level"]
        )

    def getRecommendations(self, stress_level: str) -> list[str]:
        chain = self.__prompt_template | self.__model | self.__output_parser
        recommendations = chain.invoke({"stress_level": stress_level})
        return recommendations