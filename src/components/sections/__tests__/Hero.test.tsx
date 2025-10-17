import { jest } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import Hero from "../Hero";

const buildIntersectionObserverMock = () => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
  root: null,
  rootMargin: "0px",
  thresholds: [],
});

describe("Hero", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (window as unknown as { IntersectionObserver?: jest.Mock }).IntersectionObserver = jest
      .fn()
      .mockImplementation(buildIntersectionObserverMock);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renderiza copy principal y métricas base", () => {
    render(<Hero />);
    expect(screen.getByText(/Food studio-as-a-service/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Solicitar degustación guiada/i })).toBeInTheDocument();
    expect(screen.getByText("12h")).toBeInTheDocument();
    expect(screen.getAllByText(/Hipótesis pendiente de validación/i)).toHaveLength(3);
  });
});
